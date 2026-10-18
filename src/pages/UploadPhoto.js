// src/pages/UploadPhoto.js
import React, { useState, useRef } from 'react';
import {
  Box, Typography, TextField, Button, Card, ThemeProvider, createTheme,
  CssBaseline, Avatar, CircularProgress, Alert, Stepper, Step, StepLabel,
  IconButton, List, ListItem, ListItemAvatar, ListItemText, Divider,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  CloudUpload, ArrowBack, CheckCircle, CameraAlt, Delete,
  PhotoCamera, Search,
} from '@mui/icons-material';
import axiosInstance from '../axiosConfig';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2563EB', light: '#3B82F6', dark: '#1E40AF' },
    success: { main: '#10B981' },
    error: { main: '#EF4444' },
  },
});

const StyledCard = styled(Card)(() => ({
  borderRadius: 16,
  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
  padding: 32,
  maxWidth: 500,
  margin: '0 auto',
}));

const UploadBox = styled(Box)(({ theme, isDragging }) => ({
  border: `2px dashed ${isDragging ? theme.palette.primary.main : '#ccc'}`,
  borderRadius: 12,
  padding: 40,
  textAlign: 'center',
  cursor: 'pointer',
  backgroundColor: isDragging ? '#EFF6FF' : '#FAFAFA',
  transition: 'all 0.2s ease',
  '&:hover': { borderColor: theme.palette.primary.main, backgroundColor: '#EFF6FF' },
}));

const steps = ['Enter Date of Birth', 'Upload Photo'];

const UploadPhoto = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, type: '', message: '' });

  // Step 1
  const [dob, setDob] = useState('');
  const [matchedStudents, setMatchedStudents] = useState([]);
  const [searched, setSearched] = useState(false);
  const [student, setStudent] = useState(null);

  // Step 2
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const fileRef = useRef(null);

  const showAlert = (type, message) => {
    setAlert({ open: true, type, message });
    setTimeout(() => setAlert({ open: false, type: '', message: '' }), 5000);
  };

  const handleSearchDob = async (e) => {
    e.preventDefault();
    if (!dob) { showAlert('error', 'Please enter date of birth'); return; }
    try {
      setLoading(true);
      setSearched(false);
      const res = await axiosInstance.post('/public/students-by-dob', { dateOfBirth: dob });
      if (res.data.success) {
        setMatchedStudents(res.data.data);
        setSearched(true);
        if (res.data.data.length === 0) {
          showAlert('error', 'No class 12 students found with this date of birth');
        }
      }
    } catch (error) {
      showAlert('error', error.response?.data?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };
const compressImage = (file, maxSizeKB = 30) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Scale down if too large
        const maxDim = 800;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Binary search for quality that hits ~30KB
        let lo = 0.01, hi = 0.9, bestBlob = null;

        const tryQuality = () => {
          const mid = (lo + hi) / 2;
          canvas.toBlob(
            (blob) => {
              if (!blob) { resolve(file); return; }

              if (!bestBlob || Math.abs(blob.size - maxSizeKB * 1024) < Math.abs(bestBlob.size - maxSizeKB * 1024)) {
                bestBlob = blob;
              }

              if (Math.abs(blob.size - maxSizeKB * 1024) < 2048 || (hi - lo) < 0.02) {
                // Close enough or exhausted range
                const compressed = new File([bestBlob], file.name, { type: 'image/jpeg' });
                console.log(`Compressed: ${(file.size / 1024).toFixed(0)}KB → ${(compressed.size / 1024).toFixed(0)}KB`);
                resolve(compressed);
                return;
              }

              if (blob.size > maxSizeKB * 1024) {
                hi = mid;
              } else {
                lo = mid;
              }
              tryQuality();
            },
            'image/jpeg',
            mid
          );
        };
        tryQuality();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};
  const handleSelectStudent = (s) => {
    setStudent(s);
    setActiveStep(1);
  };

  const handleFileSelect = async (selectedFile) => {
  if (!selectedFile) return;
  if (!selectedFile.type.startsWith('image/')) {
    showAlert('error', 'Please select an image file'); return;
  }
  if (selectedFile.size > 5 * 1024 * 1024) {
    showAlert('error', 'File size must be less than 5MB'); return;
  }

  // Compress to ~30KB
  const compressed = await compressImage(selectedFile, 30);
  setFile(compressed);
  setPreview(URL.createObjectURL(compressed));
};

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file) { showAlert('error', 'Please select a photo'); return; }
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('photo', file);
      const res = await axiosInstance.put(`/public/upload-photo/${student._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        setUploaded(true);
        showAlert('success', 'Photo uploaded successfully!');
      }
    } catch (error) {
      showAlert('error', error.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setActiveStep(0);
    setDob('');
    setMatchedStudents([]);
    setSearched(false);
    setStudent(null);
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setUploaded(false);
  };

  const removeFile = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: '#F0F4FF', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
        <Box sx={{ width: '100%', maxWidth: 540 }}>
          {alert.open && (
            <Alert severity={alert.type} sx={{ mb: 2 }}
              onClose={() => setAlert({ open: false, type: '', message: '' })}>
              {alert.message}
            </Alert>
          )}

          <Typography variant="h5" fontWeight="bold" color="primary" textAlign="center" sx={{ mb: 1 }}>
            Upload Student Photo
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
            Class 12 — Enter your date of birth to find your record
          </Typography>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}><StepLabel>{label}</StepLabel></Step>
            ))}
          </Stepper>

          {/* STEP 1: Enter DOB → Show matching students */}
          {activeStep === 0 && (
            <StyledCard>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>Enter Your Date of Birth</Typography>
              <form onSubmit={handleSearchDob}>
                <TextField
                  fullWidth label="Date of Birth" type="date" value={dob}
                  onChange={(e) => { setDob(e.target.value); setSearched(false); setMatchedStudents([]); }}
                  required sx={{ mb: 2 }}
                  InputLabelProps={{ shrink: true }}
                />
                <Button
                  type="submit" variant="contained" fullWidth size="large"
                  disabled={loading || !dob}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Search />}
                  sx={{ borderRadius: 2, py: 1.5, textTransform: 'none', fontSize: 16 }}
                >
                  {loading ? 'Searching...' : 'Search'}
                </Button>
              </form>

              {/* Matched Students List */}
              {searched && matchedStudents.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    {matchedStudents.length} student{matchedStudents.length > 1 ? 's' : ''} found — select yours:
                  </Typography>
                  <List sx={{ bgcolor: '#F9FAFB', borderRadius: 2, overflow: 'hidden' }}>
                    {matchedStudents.map((s, i) => (
                      <React.Fragment key={s._id}>
                        {i > 0 && <Divider />}
                        <ListItem
                          sx={{
                            cursor: 'pointer',
                            '&:hover': { bgcolor: '#EFF6FF' },
                            transition: 'background 0.15s',
                            py: 1.5,
                          }}
                          onClick={() => handleSelectStudent(s)}
                          secondaryAction={
                            <Button
                              size="small" variant="outlined"
                              startIcon={<PhotoCamera />}
                              onClick={(e) => { e.stopPropagation(); handleSelectStudent(s); }}
                              sx={{ textTransform: 'none', borderRadius: 2 }}
                            >
                              Upload
                            </Button>
                          }
                        >
                          <ListItemAvatar>
                            <Avatar src={s.photo || undefined} sx={{ bgcolor: '#2563EB' }}>
                              {s.name.charAt(0)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="body1" fontWeight="bold">{s.name}</Typography>
                            }
                            secondary={
                              <Typography variant="body2" color="text.secondary">
                                {s.houseName} &bull; Division {s.division}
                              </Typography>
                            }
                          />
                        </ListItem>
                      </React.Fragment>
                    ))}
                  </List>
                </Box>
              )}

              {searched && matchedStudents.length === 0 && (
                <Box sx={{ mt: 3, textAlign: 'center', py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    No class 12 students found with this date of birth.
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Please check the date and try again.
                  </Typography>
                </Box>
              )}
            </StyledCard>
          )}

          {/* STEP 2: Upload Photo */}
          {activeStep === 1 && student && !uploaded && (
            <StyledCard>
              <Button startIcon={<ArrowBack />} onClick={() => { setActiveStep(0); setStudent(null); setFile(null); removeFile(); }}
                sx={{ mb: 2, textTransform: 'none' }}>Back</Button>

              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Avatar
                  src={preview || student.photo || undefined}
                  sx={{ width: 100, height: 100, margin: '0 auto', mb: 1, border: '3px solid #2563EB' }}
                >
                  {student.name.charAt(0)}
                </Avatar>
                <Typography variant="h6" fontWeight="bold">{student.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {student.houseName} &bull; Division {student.division}
                </Typography>
                {student.photo && !file && (
                  <Typography variant="caption" color="success.main" sx={{ mt: 0.5, display: 'block' }}>
                    Photo already exists — uploading will replace it
                  </Typography>
                )}
              </Box>

              {!file ? (
                <UploadBox
                  isDragging={isDragging}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                >
                  <CameraAlt sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                  <Typography variant="body1" fontWeight="medium">
                    Tap to select or drag a photo here
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    JPG, PNG — max 5MB
                  </Typography>
                  <input
                    ref={fileRef} type="file" hidden accept="image/*"
                    onChange={(e) => handleFileSelect(e.target.files?.[0])}
                  />
                </UploadBox>
              ) : (
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                    <img src={preview} alt="Preview"
                      style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 12, objectFit: 'cover' }} />
                    <IconButton onClick={removeFile} size="small"
                      sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.6)', color: 'white',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                   {file.name} ({(file.size / 1024).toFixed(0)} KB)
                  </Typography>
                  <Button
                    variant="contained" fullWidth size="large" onClick={handleUpload}
                    disabled={loading} startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CloudUpload />}
                    sx={{ borderRadius: 2, py: 1.5, textTransform: 'none', fontSize: 16 }}
                  >
                    {loading ? 'Uploading...' : 'Upload Photo'}
                  </Button>
                </Box>
              )}
            </StyledCard>
          )}

          {/* Success */}
          {uploaded && (
            <StyledCard sx={{ textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>Photo Uploaded!</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {student.name}'s photo has been updated.
              </Typography>
              {preview && (
                <Avatar src={preview} sx={{ width: 120, height: 120, margin: '0 auto', mb: 3, border: '3px solid #10B981' }}>
                  {student.name.charAt(0)}
                </Avatar>
              )}
              <Button variant="outlined" onClick={handleReset} sx={{ textTransform: 'none' }}>
                Upload Another
              </Button>
            </StyledCard>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default UploadPhoto;