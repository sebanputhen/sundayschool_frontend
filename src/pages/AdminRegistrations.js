// src/pages/AdminRegistrations.js
import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  Avatar,
  Grid,
  CircularProgress,
  Alert,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Visibility,
  CheckCircle,
  Cancel,
  Delete,
  Refresh,
  FilterList,
  Search,
  ClearAll,
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
    success: {
      main: '#10B981',
    },
    error: {
      main: '#EF4444',
    },
  }
});

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 12,
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

const AdminRegistrations = () => {
  const history = useHistory();
  const [registrations, setRegistrations] = useState([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState(0); // 0: Pending, 1: Approved, 2: Rejected
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter states
  const [classFilter, setClassFilter] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('');
  
  // View Dialog
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // Reject Dialog
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState(null);
  
  // Alert states
  const [alert, setAlert] = useState({ open: false, type: '', message: '' });

  useEffect(() => {
    fetchRegistrations();
  }, [currentTab]);

  useEffect(() => {
    handleSearch();
  }, [searchQuery, classFilter, divisionFilter, registrations]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const statusMap = ['pending', 'approved', 'rejected'];
      const status = statusMap[currentTab];
      
      const response = await axiosInstance.get(`/admin/registrations?status=${status}`);
      
      if (response.data.success) {
        setRegistrations(response.data.data);
        setFilteredRegistrations(response.data.data);
        
        // Debug: Log photo URLs
        if (response.data.data.length > 0) {
          console.log('Sample photo URL:', `${axiosInstance.defaults.baseURL}${response.data.data[0].photo}`);
          console.log('Base URL:', axiosInstance.defaults.baseURL);
        }
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
      showAlert('error', 'Failed to fetch registrations');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    let filtered = [...registrations];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(student => 
        student.name.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query) ||
        student.admissionNo?.toLowerCase().includes(query) ||
        student.phoneNumber.includes(query)
      );
    }

    // Class filter
    if (classFilter) {
      filtered = filtered.filter(student => student.className === classFilter);
    }

    // Division filter
    if (divisionFilter) {
      filtered = filtered.filter(student => student.division === divisionFilter);
    }

    setFilteredRegistrations(filtered);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setClassFilter('');
    setDivisionFilter('');
  };

  const handleView = async (id) => {
    try {
      const response = await axiosInstance.get(`/admin/registrations/${id}`);
      if (response.data.success) {
        setSelectedStudent(response.data.data);
        setViewDialog(true);
      }
    } catch (error) {
      console.error('Error fetching student details:', error);
      showAlert('error', 'Failed to fetch student details');
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this registration?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await axiosInstance.put(`/admin/registrations/${id}/approve`);
      
      if (response.data.success) {
        showAlert('success', `Registration approved! Admission No: ${response.data.data.admissionNo}`);
        fetchRegistrations();
      }
    } catch (error) {
      console.error('Error approving registration:', error);
      showAlert('error', error.response?.data?.message || 'Failed to approve registration');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectClick = (id) => {
    setRejectingId(id);
    setRejectReason('');
    setRejectDialog(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) {
      showAlert('error', 'Please provide a reason for rejection');
      return;
    }

    try {
      setLoading(true);
      const response = await axiosInstance.put(
        `/admin/registrations/${rejectingId}/reject`,
        { reason: rejectReason }
      );
      
      if (response.data.success) {
        showAlert('success', 'Registration rejected');
        setRejectDialog(false);
        fetchRegistrations();
      }
    } catch (error) {
      console.error('Error rejecting registration:', error);
      showAlert('error', 'Failed to reject registration');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this registration? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await axiosInstance.delete(`/admin/registrations/${id}`);
      
      if (response.data.success) {
        showAlert('success', 'Registration deleted successfully');
        fetchRegistrations();
      }
    } catch (error) {
      console.error('Error deleting registration:', error);
      showAlert('error', 'Failed to delete registration');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ open: true, type, message });
    setTimeout(() => setAlert({ open: false, type: '', message: '' }), 5000);
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      pending: { color: 'warning', label: 'Pending' },
      approved: { color: 'success', label: 'Approved' },
      rejected: { color: 'error', label: 'Rejected' },
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ p: 3, minHeight: '100vh', bgcolor: '#F8FAFC' }}>
        <Box sx={{ maxWidth: 1400, margin: '0 auto' }}>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Student Registrations
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage student registration requests
            </Typography>
          </Box>

          {/* Alert */}
          {alert.open && (
            <Alert severity={alert.type} onClose={() => setAlert({ ...alert, open: false })} sx={{ mb: 3 }}>
              {alert.message}
            </Alert>
          )}

          {/* Filters and Actions */}
          <StyledCard>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  placeholder="Search by name, email, admission no..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  size="small"
                  fullWidth
                  InputProps={{
                    startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Class</InputLabel>
                  <Select
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                    label="Class"
                  >
                    <MenuItem value="">All Classes</MenuItem>
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
              
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Division</InputLabel>
                  <Select
                    value={divisionFilter}
                    onChange={(e) => setDivisionFilter(e.target.value)}
                    label="Division"
                  >
                    <MenuItem value="">All Divisions</MenuItem>
                    <MenuItem value="A">A</MenuItem>
                    <MenuItem value="B">B</MenuItem>
                    <MenuItem value="C">C</MenuItem>
                    <MenuItem value="D">D</MenuItem>
                    <MenuItem value="E">E</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <Button
                  variant="outlined"
                  startIcon={<ClearAll />}
                  onClick={handleClearFilters}
                  fullWidth
                  disabled={!searchQuery && !classFilter && !divisionFilter}
                >
                  Clear Filters
                </Button>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={fetchRegistrations}
                  disabled={loading}
                  fullWidth
                >
                  Refresh
                </Button>
              </Grid>
            </Grid>

            {/* Filter Summary */}
            {(searchQuery || classFilter || divisionFilter) && (
              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Active Filters:
                </Typography>
                {searchQuery && (
                  <Chip
                    label={`Search: "${searchQuery}"`}
                    size="small"
                    onDelete={() => setSearchQuery('')}
                  />
                )}
                {classFilter && (
                  <Chip
                    label={`Class: ${classFilter}`}
                    size="small"
                    onDelete={() => setClassFilter('')}
                  />
                )}
                {divisionFilter && (
                  <Chip
                    label={`Division: ${divisionFilter}`}
                    size="small"
                    onDelete={() => setDivisionFilter('')}
                  />
                )}
              </Box>
            )}

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3 }}>
              <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
                <Tab label="Pending" />
                <Tab label="Approved" />
                <Tab label="Rejected" />
              </Tabs>
            </Box>
          </StyledCard>

          {/* Table */}
          <StyledCard>
            {loading && !filteredRegistrations.length ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : filteredRegistrations.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No registrations found
                </Typography>
                {(searchQuery || classFilter || divisionFilter) && (
                  <Typography variant="body2" color="text.secondary">
                    Try adjusting your filters or search query
                  </Typography>
                )}
              </Box>
            ) : (
              <>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Showing {filteredRegistrations.length} of {registrations.length} registrations
                  </Typography>
                </Box>
                <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Photo</TableCell>
                      <TableCell>Admission No</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Class</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRegistrations.map((student) => (
                      <TableRow key={student._id} hover>
                        <TableCell>
                          <Avatar
                            src={student.photo ? `${axiosInstance.defaults.baseURL}${student.photo}` : undefined}
                            alt={student.name}
                            sx={{ width: 50, height: 50 }}
                          >
                            {student.name.charAt(0)}
                          </Avatar>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {student.admissionNo || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {student.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {student.baptismName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {student.className} - {student.division}
                        </TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{student.phoneNumber}</TableCell>
                        <TableCell>
                          {formatDate(student.registrationDate)}
                        </TableCell>
                        <TableCell>
                          {getStatusChip(student.status)}
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleView(student._id)}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            
                            {student.status === 'pending' && (
                              <>
                                <Tooltip title="Approve">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => handleApprove(student._id)}
                                  >
                                    <CheckCircle />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Reject">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleRejectClick(student._id)}
                                  >
                                    <Cancel />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                            
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDelete(student._id)}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              </>
            )}
          </StyledCard>
        </Box>
      </Box>

      {/* View Dialog */}
      <Dialog
        open={viewDialog}
        onClose={() => setViewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            Student Details
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {selectedStudent && (
            <Grid container spacing={3}>
              <Grid item xs={12} sx={{ textAlign: 'center' }}>
                <Avatar
                  src={selectedStudent.photo ? `${axiosInstance.defaults.baseURL}${selectedStudent.photo}` : undefined}
                  alt={selectedStudent.name}
                  sx={{ width: 120, height: 120, margin: '0 auto' }}
                >
                  {selectedStudent.name.charAt(0)}
                </Avatar>
                <Typography variant="h6" sx={{ mt: 2 }}>
                  {selectedStudent.name}
                </Typography>
                {getStatusChip(selectedStudent.status)}
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Student Information
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Admission Number</Typography>
                <Typography variant="body2">{selectedStudent.admissionNo || 'Not assigned'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Baptism Name</Typography>
                <Typography variant="body2">{selectedStudent.baptismName}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">House Name</Typography>
                <Typography variant="body2">{selectedStudent.houseName}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Gender</Typography>
                <Typography variant="body2">{selectedStudent.gender}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Class & Division</Typography>
                <Typography variant="body2">{selectedStudent.className} - {selectedStudent.division}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Date of Birth</Typography>
                <Typography variant="body2">{formatDate(selectedStudent.dateOfBirth)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Date of Baptism</Typography>
                <Typography variant="body2">{formatDate(selectedStudent.dateOfBaptism)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Date of Holy Communion</Typography>
                <Typography variant="body2">{formatDate(selectedStudent.dateOfHolyCommunion)}</Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Parent Information
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Father's Name</Typography>
                <Typography variant="body2">{selectedStudent.fatherName}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Father's Baptism Name</Typography>
                <Typography variant="body2">{selectedStudent.fatherBaptismName || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Mother's Name</Typography>
                <Typography variant="body2">{selectedStudent.motherName}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Mother's Baptism Name</Typography>
                <Typography variant="body2">{selectedStudent.motherBaptismName || 'N/A'}</Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Contact Information
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Email</Typography>
                <Typography variant="body2">{selectedStudent.email}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Phone</Typography>
                <Typography variant="body2">{selectedStudent.phoneNumber}</Typography>
              </Grid>

              {selectedStudent.status === 'rejected' && selectedStudent.rejectionReason && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="error" gutterBottom>
                      Rejection Reason
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2">{selectedStudent.rejectionReason}</Typography>
                  </Grid>
                </>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          {selectedStudent && selectedStudent.status === 'pending' && (
            <>
              <Button
                onClick={() => {
                  handleApprove(selectedStudent._id);
                  setViewDialog(false);
                }}
                color="success"
                variant="contained"
                startIcon={<CheckCircle />}
              >
                Approve
              </Button>
              <Button
                onClick={() => {
                  handleRejectClick(selectedStudent._id);
                  setViewDialog(false);
                }}
                color="error"
                variant="contained"
                startIcon={<Cancel />}
              >
                Reject
              </Button>
            </>
          )}
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog} onClose={() => setRejectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Registration</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Please provide a reason for rejecting this registration:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter rejection reason..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog(false)}>Cancel</Button>
          <Button
            onClick={handleRejectConfirm}
            color="error"
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
};

export default AdminRegistrations;