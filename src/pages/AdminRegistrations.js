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
  PictureAsPdf,
  Download,
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
      pending: { color: 'success', label: 'List' },
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

  const handleDownloadPDF = (student) => {
    // Import jsPDF dynamically
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;

      // Title
      doc.setFontSize(18);
      doc.setTextColor(37, 99, 235);
      doc.text('STUDENT REGISTRATION DETAILS', pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 15;
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(0.5);
      doc.line(20, yPos, pageWidth - 20, yPos);
      
      yPos += 10;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);

      // Basic Information
      doc.setFontSize(12);
      doc.setTextColor(37, 99, 235);
      doc.text('BASIC INFORMATION', 20, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Name: ${student.name}`, 25, yPos);
      yPos += 6;
      doc.text(`Baptism Name: ${student.baptismName}`, 25, yPos);
      yPos += 6;
      doc.text(`House Name: ${student.houseName}`, 25, yPos);
      yPos += 6;
      doc.text(`Class: ${student.className} - ${student.division}`, 25, yPos);
      yPos += 6;
      doc.text(`Gender: ${student.gender}`, 25, yPos);
      yPos += 6;
      if (student.admissionNo) {
        doc.text(`Admission No: ${student.admissionNo}`, 25, yPos);
        yPos += 6;
      }

      yPos += 5;

      // Important Dates
      doc.setFontSize(12);
      doc.setTextColor(37, 99, 235);
      doc.text('IMPORTANT DATES', 20, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Date of Birth: ${formatDate(student.dateOfBirth)}`, 25, yPos);
      yPos += 6;
      doc.text(`Date of Baptism: ${formatDate(student.dateOfBaptism)}`, 25, yPos);
      yPos += 6;
      doc.text(`Date of Holy Communion: ${formatDate(student.dateOfHolyCommunion)}`, 25, yPos);
      yPos += 8;

      // Father's Information
      doc.setFontSize(12);
      doc.setTextColor(37, 99, 235);
      doc.text("FATHER'S INFORMATION", 20, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Name: ${student.fatherName}`, 25, yPos);
      yPos += 6;
      doc.text(`Baptism Name: ${student.fatherBaptismName || 'N/A'}`, 25, yPos);
      yPos += 8;

      // Mother's Information
      doc.setFontSize(12);
      doc.setTextColor(37, 99, 235);
      doc.text("MOTHER'S INFORMATION", 20, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Name: ${student.motherName}`, 25, yPos);
      yPos += 6;
      doc.text(`Baptism Name: ${student.motherBaptismName || 'N/A'}`, 25, yPos);
      yPos += 8;

      // Contact Information
      doc.setFontSize(12);
      doc.setTextColor(37, 99, 235);
      doc.text('CONTACT INFORMATION', 20, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Email: ${student.email}`, 25, yPos);
      yPos += 6;
      doc.text(`Phone: ${student.phoneNumber}`, 25, yPos);
      yPos += 8;

      // Status
      // doc.setFontSize(12);
      // doc.setTextColor(37, 99, 235);
      // doc.text('REGISTRATION STATUS', 20, yPos);
      // yPos += 8;
      
      // doc.setFontSize(10);
      // doc.setTextColor(0, 0, 0);
      // doc.text(`Status: ${student.status.toUpperCase()}`, 25, yPos);
      // yPos += 6;
      // doc.text(`Registration Date: ${formatDate(student.registrationDate)}`, 25, yPos);

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, pageWidth / 2, 280, { align: 'center' });

      // Save PDF
      doc.save(`${student.name.replace(/\s+/g, '_')}_registration.pdf`);
      showAlert('success', 'PDF downloaded successfully');
    }).catch(err => {
      console.error('Error loading jsPDF:', err);
      showAlert('error', 'Failed to generate PDF. Please install jspdf: npm install jspdf');
    });
  };

  const handleDownloadAllPDF = () => {
    if (filteredRegistrations.length === 0) {
      showAlert('error', 'No students to download');
      return;
    }

    import('jspdf').then(({ jsPDF }) => {
      import('jspdf-autotable').then(() => {
        const doc = new jsPDF();
        const statusMap = ['', '', ''];
        const currentStatus = statusMap[currentTab];

        // Title Page
        doc.setFontSize(20);
        doc.setTextColor(37, 99, 235);
        doc.text('STUDENT REGISTRATION REPORT', doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });
        
        doc.setFontSize(14);
        doc.text(currentStatus.toUpperCase(), doc.internal.pageSize.getWidth() / 2, 45, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, doc.internal.pageSize.getWidth() / 2, 55, { align: 'center' });
        doc.text(`Total Students: ${filteredRegistrations.length}`, doc.internal.pageSize.getWidth() / 2, 62, { align: 'center' });
        
        if (searchQuery || classFilter || divisionFilter) {
          let filterText = 'Filters: ';
          if (searchQuery) filterText += `Search="${searchQuery}" `;
          if (classFilter) filterText += `Class=${classFilter} `;
          if (divisionFilter) filterText += `Division=${divisionFilter}`;
          doc.text(filterText, doc.internal.pageSize.getWidth() / 2, 69, { align: 'center' });
        }

        // Summary Table
        const summaryData = filteredRegistrations.map((student, index) => [
          index + 1,
          student.name,
          student.houseName,
          `${student.className}-${student.division}`,
          formatDate(student.dateOfBirth),
          formatDate(student.dateOfBaptism),
          student.fatherName,
          student.motherName,
          student.email,
          student.phoneNumber
        ]);

        doc.autoTable({
          startY: 80,
          head: [['#', 'Name', 'House', 'Class', 'DOB', 'Baptism', 'Father', 'Mother', 'Email', 'Phone']],
          body: summaryData,
          theme: 'striped',
          headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
          styles: { fontSize: 8, cellPadding: 2 },
          columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 25 },
            2: { cellWidth: 15 },
            3: { cellWidth: 15 },
            4: { cellWidth: 20 },
            5: { cellWidth: 20 },
            6: { cellWidth: 20 },
            7: { cellWidth: 20 },
            8: { cellWidth: 25 },
            9: { cellWidth: 20 }
          },
          margin: { left: 10, right: 10 }
        });

        // Detailed pages for each student
        filteredRegistrations.forEach((student, index) => {
          doc.addPage();
          let yPos = 20;

          // Student header
          doc.setFontSize(16);
          doc.setTextColor(37, 99, 235);
          doc.text(`STUDENT ${index + 1} of ${filteredRegistrations.length}`, 20, yPos);
          yPos += 10;
          
          doc.setDrawColor(37, 99, 235);
          doc.setLineWidth(0.5);
          doc.line(20, yPos, doc.internal.pageSize.getWidth() - 20, yPos);
          yPos += 10;

          // Create detailed table for this student
          const studentDetails = [
            ['Name', student.name],
            ['Baptism Name', student.baptismName],
            ['House Name', student.houseName],
            ['Class', `${student.className} - ${student.division}`],
            ['Gender', student.gender],
            ['Admission No', student.admissionNo || 'N/A'],
            ['Date of Birth', formatDate(student.dateOfBirth)],
            ['Date of Baptism', formatDate(student.dateOfBaptism)],
            ['Date of Holy Communion', formatDate(student.dateOfHolyCommunion)],
            ["Father's Name", student.fatherName],
            ["Father's Baptism Name", student.fatherBaptismName || 'N/A'],
            ["Mother's Name", student.motherName],
            ["Mother's Baptism Name", student.motherBaptismName || 'N/A'],
            ['Email', student.email],
            ['Phone', student.phoneNumber],
            ['Status', student.status.toUpperCase()],
            ['Registration Date', formatDate(student.registrationDate)]
          ];

          doc.autoTable({
            startY: yPos,
            body: studentDetails,
            theme: 'grid',
            styles: { fontSize: 10 },
            columnStyles: {
              0: { cellWidth: 60, fontStyle: 'bold', fillColor: [240, 240, 240] },
              1: { cellWidth: 110 }
            }
          });
        });

        // Save PDF
        const timestamp = new Date().toISOString().split('T')[0];
        let filename = `Students_${currentStatus}_${timestamp}`;
        if (classFilter) filename += `_Class${classFilter}`;
        if (divisionFilter) filename += `_Div${divisionFilter}`;
        filename += `_${filteredRegistrations.length}students.pdf`;

        doc.save(filename);
        showAlert('success', `PDF downloaded with ${filteredRegistrations.length} students`);
      });
    }).catch(err => {
      console.error('Error loading jsPDF:', err);
      showAlert('error', 'Failed to generate PDF. Please install: npm install jspdf jspdf-autotable');
    });
  };

  const handleDownloadAllCSV = () => {
    if (filteredRegistrations.length === 0) {
      showAlert('error', 'No students to download');
      return;
    }

    // Create CSV header
    const headers = [
      'Photo URL',
      'Name',
      'Baptism Name',
      'House Name',
      'Class',
      'Division',
      'Gender',
      'Date of Birth',
      'Date of Baptism',
      'Date of Holy Communion',
      'Father Name',
      'Father Baptism Name',
      'Mother Name',
      'Mother Baptism Name',
      'Email',
      'Phone',
      'Status',
      'Admission No',
      'Registration Date'
    ].join(',');

    // Create CSV rows
    const rows = filteredRegistrations.map(student => {
      return [
        student.photo || '',
        `"${student.name}"`,
        `"${student.baptismName}"`,
        `"${student.houseName}"`,
        student.className,
        student.division,
        student.gender,
        formatDate(student.dateOfBirth),
        formatDate(student.dateOfBaptism),
        formatDate(student.dateOfHolyCommunion),
        `"${student.fatherName}"`,
        `"${student.fatherBaptismName || ''}"`,
        `"${student.motherName}"`,
        `"${student.motherBaptismName || ''}"`,
        student.email,
        student.phoneNumber,
        student.status.toUpperCase(),
        student.admissionNo || '',
        formatDate(student.registrationDate)
      ].join(',');
    });

    const csvContent = [headers, ...rows].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Generate filename
    const statusMap = ['Pending', 'Approved', 'Rejected'];
    const timestamp = new Date().toISOString().split('T')[0];
    let filename = `Students_${statusMap[currentTab]}_${timestamp}`;
    if (classFilter) filename += `_Class${classFilter}`;
    if (divisionFilter) filename += `_Div${divisionFilter}`;
    filename += `.csv`;
    
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showAlert('success', `Downloaded CSV with ${filteredRegistrations.length} students`);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', p: 3 }}>
        {/* Alert */}
        {alert.open && (
          <Alert 
            severity={alert.type} 
            sx={{ mb: 3, position: 'fixed', top: 20, right: 20, zIndex: 9999 }}
            onClose={() => setAlert({ open: false, type: '', message: '' })}
          >
            {alert.message}
          </Alert>
        )}

        <Box sx={{ maxWidth: 1400, margin: '0 auto' }}>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight="bold" color="primary">
              Student Registrations Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage and review student registration submissions
            </Typography>
          </Box>

          {/* Tabs */}
          <StyledCard>
            <Tabs
              value={currentTab}
              onChange={(e, newValue) => setCurrentTab(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
            >
              <Tab label="List" />
              {/* <Tab label="Approved" />
              <Tab label="Rejected" /> */}
            </Tabs>

            {/* Filters */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search"
                  placeholder="Name, email, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}></TextField>
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

              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Download />}
                  onClick={handleDownloadAllPDF}
                  disabled={loading || filteredRegistrations.length === 0}
                  fullWidth
                >
                  Download All ({filteredRegistrations.length})
                </Button>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <Button
                  variant="outlined"
                  color="success"
                  startIcon={<Download />}
                  onClick={handleDownloadAllCSV}
                  disabled={loading || filteredRegistrations.length === 0}
                  fullWidth
                >
                  CSV
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
                <Tab label="List" />
                {/* <Tab label="Approved" />
                <Tab label="Rejected" /> */}
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
                      <TableCell>Name</TableCell>
                      <TableCell>House Name</TableCell>
                      <TableCell>Class</TableCell>
                      <TableCell>Date of Birth</TableCell>
                      <TableCell>Date of Baptism</TableCell>
                      <TableCell>Father</TableCell>
                      <TableCell>Mother</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Phone</TableCell>
                      {currentTab === 1 && <TableCell>Admission No</TableCell>}
                      {/* <TableCell>Status</TableCell> */}
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRegistrations.map((student) => (
                      <TableRow key={student._id} hover>
                        <TableCell>
                          <Avatar
                            src={student.photo || undefined}
                            alt={student.name}
                            sx={{ width: 50, height: 50, cursor: 'pointer' }}
                            onClick={() => handleView(student._id)}
                          >
                            {student.name.charAt(0)}
                          </Avatar>
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
                          <Typography variant="body2">
                            {student.houseName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {student.className} - {student.division}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(student.dateOfBirth)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(student.dateOfBaptism)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {student.fatherName}
                          </Typography>
                          {student.fatherBaptismName && (
                            <Typography variant="caption" color="text.secondary">
                              ({student.fatherBaptismName})
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {student.motherName}
                          </Typography>
                          {student.motherBaptismName && (
                            <Typography variant="caption" color="text.secondary">
                              ({student.motherBaptismName})
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{student.phoneNumber}</TableCell>
                        {currentTab === 1 && (
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {student.admissionNo || 'N/A'}
                            </Typography>
                          </TableCell>
                        )}
                        {/* <TableCell>
                          {getStatusChip(student.status)}
                        </TableCell> */}
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            {/* <Tooltip title="Download PDF">
                              <IconButton
                                size="small"
                                color="secondary"
                                onClick={() => handleDownloadPDF(student)}
                              >
                                <PictureAsPdf />
                              </IconButton>
                            </Tooltip> */}

                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleView(student._id)}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            
                            {/* {student.status === 'pending' && (
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
                            )} */}
                            
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
                  src={selectedStudent.photo || undefined}
                  alt={selectedStudent.name}
                  sx={{ width: 150, height: 150, margin: '0 auto', border: '4px solid #2563EB' }}
                >
                  {selectedStudent.name.charAt(0)}
                </Avatar>
                <Typography variant="h5" sx={{ mt: 2, fontWeight: 'bold' }}>
                  {selectedStudent.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {selectedStudent.baptismName}
                </Typography>
                {getStatusChip(selectedStudent.status)}
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold" sx={{ mt: 2 }}>
                  Student Information
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Admission Number</Typography>
                <Typography variant="body2" fontWeight="medium">{selectedStudent.admissionNo || 'Not assigned'}</Typography>
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
                <Typography variant="body2" fontWeight="medium">{selectedStudent.className} - {selectedStudent.division}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Date of Birth</Typography>
                <Typography variant="body2" fontWeight="medium">{formatDate(selectedStudent.dateOfBirth)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Date of Baptism</Typography>
                <Typography variant="body2" fontWeight="medium">{formatDate(selectedStudent.dateOfBaptism)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Date of Holy Communion</Typography>
                <Typography variant="body2">{formatDate(selectedStudent.dateOfHolyCommunion)}</Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold" sx={{ mt: 2 }}>
                  Parent Information
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Father's Name</Typography>
                <Typography variant="body2" fontWeight="medium">{selectedStudent.fatherName}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Father's Baptism Name</Typography>
                <Typography variant="body2">{selectedStudent.fatherBaptismName || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Mother's Name</Typography>
                <Typography variant="body2" fontWeight="medium">{selectedStudent.motherName}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Mother's Baptism Name</Typography>
                <Typography variant="body2">{selectedStudent.motherBaptismName || 'N/A'}</Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold" sx={{ mt: 2 }}>
                  Contact Information
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Email</Typography>
                <Typography variant="body2" fontWeight="medium">{selectedStudent.email}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Phone</Typography>
                <Typography variant="body2" fontWeight="medium">{selectedStudent.phoneNumber}</Typography>
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
          {selectedStudent && (
            <Button
              onClick={() => handleDownloadPDF(selectedStudent)}
              variant="outlined"
              startIcon={<PictureAsPdf />}
            >
              Download PDF
            </Button>
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