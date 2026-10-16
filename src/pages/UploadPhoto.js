// src/pages/UploadPhoto.js
import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, TextField, Button, Card, ThemeProvider, createTheme,
  CssBaseline, Avatar, CircularProgress, Alert, Stepper, Step, StepLabel,
  IconButton, Autocomplete,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { CloudUpload, ArrowBack, CheckCircle, CameraAlt, Delete } from '@mui/icons-material';
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

const steps = ['Select Student', 'Upload Photo'];

const UploadPhoto = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, type: '', message: '' });

  // Step 1
  const [studentsList, setStudentsList] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [dob, setDob] = useState('');
  const [student, setStudent] = useState(null);

  // Step 2
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      const res = await axiosInstance.get('/public/students-12');
      if (res.data.success) {
        setStudentsList(res.data.data);
      }
    } catch (error) {
      showAlert('error', 'Failed to load students list');
    } finally {
      setLoadingStudents(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ open: true, type, message });
    setTimeout(() => setAlert({ open: false, type: '', message: '' }), 5000);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!selectedOption || !dob) {
      showAlert('error', 'Please select a student and enter date of birth');
      return;
    }
    try {
      setLoading(true);
      const res = await axiosInstance.post('/public/verify-student', {
        studentId: selectedOption._id,
        dateOfBirth: dob,
      });
      if (res.data.success) {
        setStudent(res.data.data);
        setActiveStep(1);
      }
    } catch (error) {
      showAlert('error', error.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith('image/')) {
      showAlert('error', 'Please select an image file');
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      showAlert('error', 'File size must be less than 5MB');
      return;
    }
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
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
    setSelectedOption(null);
    setDob('');
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
            Class 12 — Select your name and verify with date of birth
          </Typography>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}><StepLabel>{label}</StepLabel></Step>
            ))}
          </Stepper>

          {/* STEP 1 */}
          {activeStep === 0 && (
            <StyledCard>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>Select Your Name</Typography>
              <form onSubmit={handleVerify}>
                <Autocomplete
                  options={studentsList}
                  loading={loadingStudents}
                  value={selectedOption}
                  onChange={(e, val) => setSelectedOption(val)}
                  getOptionLabel={(opt) => `${opt.name} — ${opt.houseName}`}
                  renderOption={(props, opt) => (
                    <li {...props} key={opt._id}>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">{opt.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {opt.houseName} &bull; {opt.division}
                        </Typography>
                      </Box>
                    </li>
                  )}
                  isOptionEqualToValue={(opt, val) => opt._id === val._id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Student Name — House Name"
                      placeholder="Type to search..."
                      required
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingStudents ? <CircularProgress size={18} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  sx={{ mb: 2 }}
                  noOptionsText="No students found"
                />

                <TextField
                  fullWidth label="Date of Birth" type="date" value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  required sx={{ mb: 3 }}
                  InputLabelProps={{ shrink: true }}
                  helperText="Enter your DOB to verify identity"
                />

                <Button
                  type="submit" variant="contained" fullWidth size="large"
                  disabled={loading || !selectedOption || !dob}
                  sx={{ borderRadius: 2, py: 1.5, textTransform: 'none', fontSize: 16 }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Next — Upload Photo'}
                </Button>
              </form>
            </StyledCard>
          )}

          {/* STEP 2 */}
          {activeStep === 1 && student && !uploaded && (
            <StyledCard>
              <Button startIcon={<ArrowBack />} onClick={() => setActiveStep(0)}
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
                  {student.houseName} &bull; {student.className}-{student.division}
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
                    {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
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