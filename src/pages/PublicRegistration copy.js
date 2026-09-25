// src/pages/PublicRegistration.js
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  ThemeProvider,
  createTheme,
  CssBaseline,
  CircularProgress,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Avatar,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Backdrop,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  PersonAdd,
  Email,
  Phone,
  CalendarMonth,
  PhotoCamera,
  School,
  Wc,
  Church,
  Person,
  FamilyRestroom,
  CheckCircle,
  Error as ErrorIcon,
  Home,
  CloudUpload,
} from '@mui/icons-material';
import axiosInstance from "../axiosConfig";

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563EB',
      light: '#3B82F6',
      dark: '#1E40AF'
    },
    secondary: {
      main: '#10B981',
      light: '#34D399',
      dark: '#047857'
    }
  }
});

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 12,
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  padding: theme.spacing(4),
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4),
}));

const StyledBox = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background: 'linear-gradient(120deg, #E2E8F0 0%, #F8FAFC 100%)',
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
}));

const PhotoUploadBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(3),
  border: '2px dashed',
  borderColor: theme.palette.grey[300],
  borderRadius: theme.spacing(1),
  cursor: 'pointer',
  transition: 'all 0.3s',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.grey[50]
  }
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontWeight: 600,
  marginTop: theme.spacing(3),
  marginBottom: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const ProgressBackdrop = styled(Backdrop)(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  color: '#fff',
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
}));

const ProgressBox = styled(Box)(({ theme }) => ({
  backgroundColor: 'white',
  borderRadius: theme.spacing(2),
  padding: theme.spacing(4),
  minWidth: 300,
  textAlign: 'center',
}));

const PublicRegistration = () => {
  const history = useHistory();
  
  const [formData, setFormData] = useState({
    admissionNo: '',
    name: '',
    baptismName: '',
    houseName: '',
    gender: '',
    className: '',
    division: '',
    dateOfBirth: '',
    dateOfBaptism: '',
    dateOfHolyCommunion: '',
    fatherName: '',
    fatherBaptismName: '',
    motherName: '',
    motherBaptismName: '',
    phoneNumber: '',
    email: '',
  });

  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  
  // Popup states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'dateOfBirth') {
      const newDob = new Date(value);
      const baptismDate = formData.dateOfBaptism ? new Date(formData.dateOfBaptism) : null;
      const communionDate = formData.dateOfHolyCommunion ? new Date(formData.dateOfHolyCommunion) : null;
      
      setFormData(prev => ({
        ...prev,
        [name]: value,
        dateOfBaptism: baptismDate && baptismDate < newDob ? '' : prev.dateOfBaptism,
        dateOfHolyCommunion: communionDate && communionDate < newDob ? '' : prev.dateOfHolyCommunion,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const compressImage = (file, maxSizeKB = 30) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const maxDimension = 800;
          if (width > height && width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          let quality = 0.7;
          const tryCompress = () => {
            canvas.toBlob(
              (blob) => {
                if (blob.size <= maxSizeKB * 1024 || quality <= 0.1) {
                  const compressedFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  });
                  resolve(compressedFile);
                } else {
                  quality -= 0.1;
                  tryCompress();
                }
              },
              'image/jpeg',
              quality
            );
          };
          
          tryCompress();
        };
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
    });
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setDialogType('error');
        setDialogMessage('Photo size should be less than 10MB');
        setDialogOpen(true);
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setDialogType('error');
        setDialogMessage('Please upload a valid image file');
        setDialogOpen(true);
        return;
      }

      try {
        setLoading(true);
        
        const compressedFile = await compressImage(file, 30);
        
        setPhoto(compressedFile);
        
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreview(reader.result);
        };
        reader.readAsDataURL(compressedFile);
        
        const sizeKB = (compressedFile.size / 1024).toFixed(2);
        console.log(`Image compressed to ${sizeKB}KB`);
        
        setLoading(false);
      } catch (error) {
        console.error('Image compression error:', error);
        setDialogType('error');
        setDialogMessage('Failed to compress image. Please try another photo.');
        setDialogOpen(true);
        setLoading(false);
      }
    }
  };

  const validateForm = () => {
    const requiredFields = [
      'name', 'baptismName', 'houseName', 'gender', 'className', 
      'division', 'dateOfBirth', 'dateOfBaptism', 'fatherName', 
      'motherName', 'phoneNumber', 'email'
    ];

    for (let field of requiredFields) {
      if (!formData[field] || formData[field].trim() === '') {
        setDialogType('error');
        setDialogMessage(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        setDialogOpen(true);
        return false;
      }
    }

    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setDialogType('error');
      setDialogMessage('Please enter a valid email address');
      setDialogOpen(true);
      return false;
    }

    if (formData.phoneNumber.length < 10) {
      setDialogType('error');
      setDialogMessage('Please enter a valid phone number (at least 10 digits)');
      setDialogOpen(true);
      return false;
    }

    const dob = new Date(formData.dateOfBirth);
    const today = new Date();
    if (dob > today) {
      setDialogType('error');
      setDialogMessage('Date of birth cannot be in the future');
      setDialogOpen(true);
      return false;
    }

    if (formData.dateOfBaptism) {
      const baptismDate = new Date(formData.dateOfBaptism);
      if (baptismDate < dob) {
        setDialogType('error');
        setDialogMessage('Date of baptism must be after date of birth');
        setDialogOpen(true);
        return false;
      }
      if (baptismDate > today) {
        setDialogType('error');
        setDialogMessage('Date of baptism cannot be in the future');
        setDialogOpen(true);
        return false;
      }
    }

    if (formData.dateOfHolyCommunion) {
      const communionDate = new Date(formData.dateOfHolyCommunion);
      if (communionDate < dob) {
        setDialogType('error');
        setDialogMessage('Date of holy communion must be after date of birth');
        setDialogOpen(true);
        return false;
      }
      if (communionDate > today) {
        setDialogType('error');
        setDialogMessage('Date of holy communion cannot be in the future');
        setDialogOpen(true);
        return false;
      }
    }

    if (!photo) {
      setDialogType('error');
      setDialogMessage('Please upload a photo');
      setDialogOpen(true);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      setUploadProgress(0);
      setUploadStatus('Preparing your registration...');

      const formDataToSend = new FormData();
      
      // Simulate progress steps
      setTimeout(() => {
        setUploadProgress(20);
        setUploadStatus('Validating information...');
      }, 200);

      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key].trim());
      });
      
      if (photo) {
        formDataToSend.append('photo', photo);
      }

      setTimeout(() => {
        setUploadProgress(40);
        setUploadStatus('Uploading photo...');
      }, 400);

      const response = await axiosInstance.post('/public/register', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(40 + (percentCompleted * 0.5)); // 40-90%
          if (percentCompleted > 50) {
            setUploadStatus('Processing registration...');
          }
        }
      });

      setUploadProgress(100);
      setUploadStatus('Registration complete!');

      // Small delay to show 100% completion
      await new Promise(resolve => setTimeout(resolve, 500));

      if (response.data.success) {
        setLoading(false);
        setDialogType('success');
        setDialogMessage('Registration submitted successfully! You will be notified via email once approved.');
        setDialogOpen(true);
        
        // Clear form
        setFormData({
          admissionNo: '',
          name: '',
          baptismName: '',
          houseName: '',
          gender: '',
          className: '',
          division: '',
          dateOfBirth: '',
          dateOfBaptism: '',
          dateOfHolyCommunion: '',
          fatherName: '',
          fatherBaptismName: '',
          motherName: '',
          motherBaptismName: '',
          phoneNumber: '',
          email: '',
        });
        setPhoto(null);
        setPhotoPreview(null);
        setUploadProgress(0);
        setUploadStatus('');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setLoading(false);
      setUploadProgress(0);
      setUploadStatus('');
      setDialogType('error');
      setDialogMessage(
        error.response?.data?.message || 
        'Registration failed. Please try again.'
      );
      setDialogOpen(true);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <StyledBox>
        <Container maxWidth="md">
          <StyledCard>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <PersonAdd sx={{ fontSize: 56, color: 'primary.main', mb: 2 }} />
              <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
                Student Registration
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Please fill in all required information
              </Typography>
            </Box>

            <Box component="form" onSubmit={handleSubmit}>
              {/* Photo Upload */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="photo-upload"
                  type="file"
                  onChange={handlePhotoChange}
                  disabled={loading}
                />
                <label htmlFor="photo-upload">
                  <PhotoUploadBox>
                    {photoPreview ? (
                      <Avatar
                        src={photoPreview}
                        sx={{ width: 120, height: 120 }}
                      />
                    ) : (
                      <Avatar sx={{ width: 120, height: 120, bgcolor: 'grey.300' }}>
                        <PhotoCamera sx={{ fontSize: 48 }} />
                      </Avatar>
                    )}
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<PhotoCamera />}
                      disabled={loading}
                    >
                      Upload Photo
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                      Max size: 10MB (will be compressed to ~30KB)
                    </Typography>
                  </PhotoUploadBox>
                </label>
              </Box>

              {/* Student Information Section */}
              <SectionTitle variant="h6">
                <School /> Student Information
              </SectionTitle>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={loading}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Baptism Name"
                    name="baptismName"
                    value={formData.baptismName}
                    onChange={handleChange}
                    disabled={loading}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Church />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="House Name"
                    name="houseName"
                    value={formData.houseName}
                    onChange={handleChange}
                    disabled={loading}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Home />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Gender</InputLabel>
                    <Select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      disabled={loading}
                      label="Gender"
                      startAdornment={
                        <InputAdornment position="start">
                          <Wc />
                        </InputAdornment>
                      }
                    >
                      <MenuItem value="Male">Male</MenuItem>
                      <MenuItem value="Female">Female</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Class</InputLabel>
                    <Select
                      name="className"
                      value={formData.className}
                      onChange={handleChange}
                      disabled={loading}
                      label="Class"
                    >
                      <MenuItem value="1">Class 1</MenuItem>
                      <MenuItem value="2">Class 2</MenuItem>
                      <MenuItem value="3">Class 3</MenuItem>
                      <MenuItem value="4">Class 4</MenuItem>
                      <MenuItem value="5">Class 5</MenuItem>
                      <MenuItem value="6">Class 6</MenuItem>
                      <MenuItem value="7">Class 7</MenuItem>
                      <MenuItem value="8">Class 8</MenuItem>
                      <MenuItem value="9">Class 9</MenuItem>
                      <MenuItem value="10">Class 10</MenuItem>
                      <MenuItem value="11">Class 11</MenuItem>
                      <MenuItem value="12">Class 12</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Division</InputLabel>
                    <Select
                      name="division"
                      value={formData.division}
                      onChange={handleChange}
                      disabled={loading}
                      label="Division"
                    >
                      <MenuItem value="A">A</MenuItem>
                      <MenuItem value="B">B</MenuItem>
                      <MenuItem value="C">C</MenuItem>
                      <MenuItem value="D">D</MenuItem>
                      <MenuItem value="E">E</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Date of Birth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    disabled={loading}
                    required
                    InputLabelProps={{ shrink: true }}
                    inputProps={{
                      max: new Date().toISOString().split('T')[0],
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarMonth />
                        </InputAdornment>
                      ),
                    }}
                    helperText="Select date up to today"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Date of Baptism"
                    name="dateOfBaptism"
                    type="date"
                    value={formData.dateOfBaptism}
                    onChange={handleChange}
                    disabled={loading || !formData.dateOfBirth}
                    required
                    InputLabelProps={{ shrink: true }}
                    inputProps={{
                      min: formData.dateOfBirth || undefined,
                      max: new Date().toISOString().split('T')[0],
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Church />
                        </InputAdornment>
                      ),
                    }}
                    helperText={!formData.dateOfBirth ? "Select date of birth first" : "Select date after birth"}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Date of Holy Communion"
                    name="dateOfHolyCommunion"
                    type="date"
                    value={formData.dateOfHolyCommunion}
                    onChange={handleChange}
                    disabled={loading || !formData.dateOfBirth}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{
                      min: formData.dateOfBirth || undefined,
                      max: new Date().toISOString().split('T')[0],
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Church />
                        </InputAdornment>
                      ),
                    }}
                    helperText={!formData.dateOfBirth ? "Select date of birth first" : "Select date after birth (optional)"}
                  />
                </Grid>
              </Grid>

              {/* Parent Information Section */}
              <SectionTitle variant="h6">
                <FamilyRestroom /> Parent Information
              </SectionTitle>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Father's Name"
                    name="fatherName"
                    value={formData.fatherName}
                    onChange={handleChange}
                    disabled={loading}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Father's Baptism Name"
                    name="fatherBaptismName"
                    value={formData.fatherBaptismName}
                    onChange={handleChange}
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Church />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Mother's Name"
                    name="motherName"
                    value={formData.motherName}
                    onChange={handleChange}
                    disabled={loading}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Mother's Baptism Name"
                    name="motherBaptismName"
                    value={formData.motherBaptismName}
                    onChange={handleChange}
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Church />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>

              {/* Contact Information Section */}
              <SectionTitle variant="h6">
                <Phone /> Contact Information
              </SectionTitle>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    disabled={loading}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Phone />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
                sx={{
                  py: 1.5,
                  mt: 4,
                  backgroundColor: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                  'Submit Registration'
                )}
              </Button>

              <Typography 
                variant="caption" 
                color="text.secondary" 
                sx={{ textAlign: 'center', mt: 2, display: 'block' }}
              >
                All fields marked with * are required. Your registration will be reviewed by the administration.
              </Typography>
            </Box>
          </StyledCard>
        </Container>
      </StyledBox>

      {/* Progress Backdrop */}
      <ProgressBackdrop open={loading}>
        <ProgressBox>
          <CloudUpload sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" color="primary" gutterBottom>
            {uploadStatus}
          </Typography>
          <Box sx={{ width: '100%', mt: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={uploadProgress} 
              sx={{ height: 8, borderRadius: 4 }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {uploadProgress}%
            </Typography>
          </Box>
        </ProgressBox>
      </ProgressBackdrop>

      {/* Success/Error Popup Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          textAlign: 'center', 
          pt: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2
        }}>
          {dialogType === 'success' ? (
            <CheckCircle sx={{ fontSize: 64, color: 'success.main' }} />
          ) : (
            <ErrorIcon sx={{ fontSize: 64, color: 'error.main' }} />
          )}
          <Typography variant="h5" fontWeight="bold">
            {dialogType === 'success' ? 'Success!' : 'Error'}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" textAlign="center" sx={{ py: 2 }}>
            {dialogMessage}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button
            onClick={handleDialogClose}
            variant="contained"
            size="large"
            sx={{
              minWidth: 120,
              backgroundColor: dialogType === 'success' ? 'success.main' : 'primary.main',
              '&:hover': {
                backgroundColor: dialogType === 'success' ? 'success.dark' : 'primary.dark',
              },
            }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
};

export default PublicRegistration;