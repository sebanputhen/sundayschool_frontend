// src/pages/AdminRegistrations.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Typography, Button, Card, ThemeProvider, createTheme, CssBaseline,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Tabs, Tab, Avatar, Grid, CircularProgress, Alert, Tooltip,
  FormControl, InputLabel, Select, MenuItem, TablePagination,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Visibility, CheckCircle, Cancel, Delete, Refresh,
  ClearAll, PictureAsPdf, Download,
} from '@mui/icons-material';
import axiosInstance from "../axiosConfig";

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2563EB', light: '#3B82F6', dark: '#1E40AF' },
    success: { main: '#10B981' },
    error: { main: '#EF4444' },
  },
});

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 12,
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

// Generate year options from 2020 to current year
const currentYear = new Date().getFullYear();
const yearOptions = [];
for (let y = currentYear; y >= 2020; y--) yearOptions.push(y);

const AdminRegistrations = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('');
  const [yearFilter, setYearFilter] = useState(String(currentYear));

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [totalCount, setTotalCount] = useState(0);

  // Dialogs
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState(null);
  const [alert, setAlert] = useState({ open: false, type: '', message: '' });

  // Debounce ref
  const debounceRef = useRef(null);

  const fetchRegistrations = useCallback(async (overrides = {}) => {
    try {
      setLoading(true);
      const statusMap = ['pending', 'approved', 'rejected'];
      const params = {
        status: statusMap[currentTab],
        page: (overrides.page ?? page) + 1,
        limit: overrides.rowsPerPage ?? rowsPerPage,
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (classFilter) params.className = classFilter;
      if (divisionFilter) params.division = divisionFilter;
      if (yearFilter) params.year = yearFilter;

      const response = await axiosInstance.get('/admin/registrations', { params });

      if (response.data.success) {
        setRegistrations(response.data.data);
        setTotalCount(response.data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
      showAlert('error', 'Failed to fetch registrations');
    } finally {
      setLoading(false);
    }
  }, [currentTab, searchQuery, classFilter, divisionFilter, yearFilter, page, rowsPerPage]);

  // Fetch on filter/tab/page change
  useEffect(() => {
    fetchRegistrations();
  }, [currentTab, classFilter, divisionFilter, yearFilter, page, rowsPerPage]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(0);
      fetchRegistrations({ page: 0 });
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(0);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setClassFilter('');
    setDivisionFilter('');
    setYearFilter(String(currentYear));
    setPage(0);
  };

  const handleView = async (id) => {
    try {
      const response = await axiosInstance.get(`/admin/registrations/${id}`);
      if (response.data.success) {
        setSelectedStudent(response.data.data);
        setViewDialog(true);
      }
    } catch (error) {
      showAlert('error', 'Failed to fetch student details');
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this registration?')) return;
    try {
      setLoading(true);
      const response = await axiosInstance.put(`/admin/registrations/${id}/approve`);
      if (response.data.success) {
        showAlert('success', `Approved! Admission No: ${response.data.data.admissionNo}`);
        fetchRegistrations();
      }
    } catch (error) {
      showAlert('error', error.response?.data?.message || 'Failed to approve');
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
    if (!rejectReason.trim()) { showAlert('error', 'Provide a reason'); return; }
    try {
      setLoading(true);
      const response = await axiosInstance.put(`/admin/registrations/${rejectingId}/reject`, { reason: rejectReason });
      if (response.data.success) {
        showAlert('success', 'Registration rejected');
        setRejectDialog(false);
        fetchRegistrations();
      }
    } catch (error) {
      showAlert('error', 'Failed to reject');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this registration? Cannot be undone.')) return;
    try {
      setLoading(true);
      const response = await axiosInstance.delete(`/admin/registrations/${id}`);
      if (response.data.success) {
        showAlert('success', 'Deleted');
        fetchRegistrations();
      }
    } catch (error) {
      showAlert('error', 'Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ open: true, type, message });
    setTimeout(() => setAlert({ open: false, type: '', message: '' }), 5000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleDownloadPDF = (student) => {
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF();
      const pw = doc.internal.pageSize.getWidth();
      let y = 20;
      doc.setFontSize(18); doc.setTextColor(37, 99, 235);
      doc.text('STUDENT REGISTRATION DETAILS', pw / 2, y, { align: 'center' });
      y += 15; doc.line(20, y, pw - 20, y); y += 10;

      const lines = [
        ['BASIC INFORMATION'],
        [`Name: ${student.name}`], [`Baptism Name: ${student.baptismName}`],
        [`House Name: ${student.houseName}`], [`Class: ${student.className} - ${student.division}`],
        [`Gender: ${student.gender}`],
        ...(student.admissionNo ? [[`Admission No: ${student.admissionNo}`]] : []),
        [''], ['IMPORTANT DATES'],
        [`Date of Birth: ${formatDate(student.dateOfBirth)}`],
        [`Date of Baptism: ${formatDate(student.dateOfBaptism)}`],
        [`Date of Holy Communion: ${formatDate(student.dateOfHolyCommunion)}`],
        [''], ["FATHER'S INFORMATION"],
        [`Name: ${student.fatherName}`], [`Baptism Name: ${student.fatherBaptismName || 'N/A'}`],
        [''], ["MOTHER'S INFORMATION"],
        [`Name: ${student.motherName}`], [`Baptism Name: ${student.motherBaptismName || 'N/A'}`],
        [''], ['CONTACT INFORMATION'],
        [`Email: ${student.email}`], [`Phone: ${student.phoneNumber}`],
      ];

      lines.forEach(([line]) => {
        if (line === '') { y += 5; return; }
        if (line === line.toUpperCase() && line.length > 3) {
          doc.setFontSize(12); doc.setTextColor(37, 99, 235); doc.text(line, 20, y); y += 8;
          doc.setFontSize(10); doc.setTextColor(0, 0, 0);
        } else {
          doc.text(line, 25, y); y += 6;
        }
      });

      doc.setFontSize(8); doc.setTextColor(128, 128, 128);
      doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, pw / 2, 280, { align: 'center' });
      doc.save(`${student.name.replace(/\s+/g, '_')}_registration.pdf`);
      showAlert('success', 'PDF downloaded');
    }).catch(() => showAlert('error', 'Failed to generate PDF'));
  };

  const handleDownloadAllPDF = () => {
    if (registrations.length === 0) { showAlert('error', 'No students'); return; }
    import('jspdf').then(({ jsPDF }) => {
      import('jspdf-autotable').then(() => {
        const doc = new jsPDF();
        const pw = doc.internal.pageSize.getWidth();
        doc.setFontSize(20); doc.setTextColor(37, 99, 235);
        doc.text('STUDENT REGISTRATION REPORT', pw / 2, 30, { align: 'center' });
        doc.setFontSize(10); doc.setTextColor(0, 0, 0);
        doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, pw / 2, 45, { align: 'center' });
        doc.text(`Total: ${registrations.length} | Year: ${yearFilter || 'All'}`, pw / 2, 52, { align: 'center' });

        const rows = registrations.map((s, i) => [
          i + 1, s.name, s.houseName, `${s.className}-${s.division}`,
          formatDate(s.dateOfBirth), formatDate(s.dateOfBaptism),
          s.fatherName, s.motherName, s.email, s.phoneNumber,
        ]);
        doc.autoTable({
          startY: 65,
          head: [['#', 'Name', 'House', 'Class', 'DOB', 'Baptism', 'Father', 'Mother', 'Email', 'Phone']],
          body: rows,
          theme: 'striped',
          headStyles: { fillColor: [37, 99, 235] },
          styles: { fontSize: 7, cellPadding: 2 },
          margin: { left: 10, right: 10 },
        });

        registrations.forEach((student, i) => {
          doc.addPage();
          let y = 20;
          doc.setFontSize(14); doc.setTextColor(37, 99, 235);
          doc.text(`STUDENT ${i + 1} / ${registrations.length}`, 20, y); y += 10;
          doc.autoTable({
            startY: y,
            body: [
              ['Name', student.name], ['Baptism Name', student.baptismName],
              ['House Name', student.houseName], ['Class', `${student.className} - ${student.division}`],
              ['Gender', student.gender], ['Admission No', student.admissionNo || 'N/A'],
              ['DOB', formatDate(student.dateOfBirth)], ['Baptism', formatDate(student.dateOfBaptism)],
              ['Holy Communion', formatDate(student.dateOfHolyCommunion)],
              ['Father', student.fatherName], ['Father Baptism', student.fatherBaptismName || 'N/A'],
              ['Mother', student.motherName], ['Mother Baptism', student.motherBaptismName || 'N/A'],
              ['Email', student.email], ['Phone', student.phoneNumber],
              ['Registered', formatDate(student.registrationDate)],
            ],
            theme: 'grid', styles: { fontSize: 10 },
            columnStyles: { 0: { cellWidth: 60, fontStyle: 'bold', fillColor: [240, 240, 240] }, 1: { cellWidth: 110 } },
          });
        });

        const ts = new Date().toISOString().split('T')[0];
        doc.save(`Students_${yearFilter || 'All'}_${ts}.pdf`);
        showAlert('success', `PDF downloaded with ${registrations.length} students`);
      });
    }).catch(() => showAlert('error', 'Failed to generate PDF'));
  };

  const handleDownloadAllCSV = () => {
    if (registrations.length === 0) { showAlert('error', 'No students'); return; }
    const headers = ['Name','Baptism Name','House Name','Class','Division','Gender','DOB','Baptism Date','Holy Communion','Father','Father Baptism','Mother','Mother Baptism','Email','Phone','Status','Admission No','Registration Date'];
    const rows = registrations.map(s => [
      `"${s.name}"`, `"${s.baptismName}"`, `"${s.houseName}"`, s.className, s.division, s.gender,
      formatDate(s.dateOfBirth), formatDate(s.dateOfBaptism), formatDate(s.dateOfHolyCommunion),
      `"${s.fatherName}"`, `"${s.fatherBaptismName || ''}"`, `"${s.motherName}"`, `"${s.motherBaptismName || ''}"`,
      s.email, s.phoneNumber, s.status, s.admissionNo || '', formatDate(s.registrationDate),
    ].join(','));
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `Students_${yearFilter || 'All'}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(a.href);
    showAlert('success', `CSV downloaded`);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', p: 3 }}>
        {alert.open && (
          <Alert severity={alert.type} sx={{ mb: 3, position: 'fixed', top: 20, right: 20, zIndex: 9999 }}
            onClose={() => setAlert({ open: false, type: '', message: '' })}>
            {alert.message}
          </Alert>
        )}

        <Box sx={{ maxWidth: 1400, margin: '0 auto' }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight="bold" color="primary">Student Registrations</Typography>
            <Typography variant="body2" color="text.secondary">
              {totalCount} total registrations {yearFilter && `in ${yearFilter}`}
            </Typography>
          </Box>

          <StyledCard>
            <Tabs value={currentTab} onChange={(e, v) => { setCurrentTab(v); setPage(0); }}
              sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tab label="List" />
            </Tabs>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField fullWidth size="small" label="Search" placeholder="Name, email, phone..."
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </Grid>
              <Grid item xs={6} sm={3} md={1.5}>
                <FormControl fullWidth size="small">
                  <InputLabel>Year</InputLabel>
                  <Select value={yearFilter} onChange={handleFilterChange(setYearFilter)} label="Year">
                    <MenuItem value="">All Years</MenuItem>
                    {yearOptions.map(y => <MenuItem key={y} value={String(y)}>{y}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={3} md={1.5}>
                <FormControl fullWidth size="small">
                  <InputLabel>Class</InputLabel>
                  <Select value={classFilter} onChange={handleFilterChange(setClassFilter)} label="Class">
                    <MenuItem value="">All</MenuItem>
                    {[...Array(12)].map((_, i) => <MenuItem key={i+1} value={String(i+1)}>Class {i+1}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={3} md={1.5}>
                <FormControl fullWidth size="small">
                  <InputLabel>Division</InputLabel>
                  <Select value={divisionFilter} onChange={handleFilterChange(setDivisionFilter)} label="Division">
                    <MenuItem value="">All</MenuItem>
                    {['A','B','C','D','E'].map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={3} md={1.5}>
                <Button variant="outlined" startIcon={<ClearAll />} onClick={handleClearFilters} fullWidth
                  disabled={!searchQuery && !classFilter && !divisionFilter && yearFilter === String(currentYear)}>
                  Clear
                </Button>
              </Grid>
              <Grid item xs={6} sm={3} md={1.5}>
                <Button variant="outlined" startIcon={<Refresh />} onClick={() => fetchRegistrations()}
                  disabled={loading} fullWidth>Refresh</Button>
              </Grid>
              <Grid item xs={6} sm={3} md={1.5}>
                <Button variant="contained" startIcon={<Download />} onClick={handleDownloadAllPDF}
                  disabled={loading || registrations.length === 0} fullWidth size="small">
                  PDF ({registrations.length})
                </Button>
              </Grid>
              <Grid item xs={6} sm={3} md={1.5}>
                <Button variant="outlined" color="success" startIcon={<Download />} onClick={handleDownloadAllCSV}
                  disabled={loading || registrations.length === 0} fullWidth size="small">CSV</Button>
              </Grid>
            </Grid>
          </StyledCard>

          <StyledCard>
            {loading && registrations.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
            ) : registrations.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary">No registrations found</Typography>
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Photo</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>House</TableCell>
                        <TableCell>Class</TableCell>
                        <TableCell>DOB</TableCell>
                        <TableCell>Baptism</TableCell>
                        <TableCell>Father</TableCell>
                        <TableCell>Mother</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Phone</TableCell>
                        {currentTab === 1 && <TableCell>Adm No</TableCell>}
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {registrations.map((student) => (
                        <TableRow key={student._id} hover>
                          <TableCell>
                            <Avatar src={student.photo || undefined} alt={student.name}
                              sx={{ width: 40, height: 40, cursor: 'pointer' }}
                              onClick={() => handleView(student._id)}>
                              {student.name.charAt(0)}
                            </Avatar>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">{student.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{student.baptismName}</Typography>
                          </TableCell>
                          <TableCell>{student.houseName}</TableCell>
                          <TableCell>{student.className}-{student.division}</TableCell>
                          <TableCell>{formatDate(student.dateOfBirth)}</TableCell>
                          <TableCell>{formatDate(student.dateOfBaptism)}</TableCell>
                          <TableCell>
                            <Typography variant="body2">{student.fatherName}</Typography>
                            {student.fatherBaptismName && <Typography variant="caption" color="text.secondary">({student.fatherBaptismName})</Typography>}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{student.motherName}</Typography>
                            {student.motherBaptismName && <Typography variant="caption" color="text.secondary">({student.motherBaptismName})</Typography>}
                          </TableCell>
                          <TableCell><Typography variant="caption">{student.email}</Typography></TableCell>
                          <TableCell>{student.phoneNumber}</TableCell>
                          {currentTab === 1 && <TableCell>{student.admissionNo || 'N/A'}</TableCell>}
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                              <Tooltip title="View">
                                <IconButton size="small" color="primary" onClick={() => handleView(student._id)}><Visibility fontSize="small" /></IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton size="small" color="error" onClick={() => handleDelete(student._id)}><Delete fontSize="small" /></IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={totalCount}
                  page={page}
                  onPageChange={(e, p) => setPage(p)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                  rowsPerPageOptions={[25, 50, 100]}
                />
              </>
            )}
          </StyledCard>
        </Box>
      </Box>

      {/* View Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle><Typography variant="h6" fontWeight="bold">Student Details</Typography></DialogTitle>
        <DialogContent dividers>
          {selectedStudent && (
            <Grid container spacing={3}>
              <Grid item xs={12} sx={{ textAlign: 'center' }}>
                <Avatar src={selectedStudent.photo || undefined} alt={selectedStudent.name}
                  sx={{ width: 150, height: 150, margin: '0 auto', border: '4px solid #2563EB' }}>
                  {selectedStudent.name.charAt(0)}
                </Avatar>
                <Typography variant="h5" sx={{ mt: 2, fontWeight: 'bold' }}>{selectedStudent.name}</Typography>
                <Typography variant="body2" color="text.secondary">{selectedStudent.baptismName}</Typography>
              </Grid>
              {[
                ['Admission No', selectedStudent.admissionNo || 'Not assigned'], ['House Name', selectedStudent.houseName],
                ['Gender', selectedStudent.gender], ['Class', `${selectedStudent.className} - ${selectedStudent.division}`],
                ['Date of Birth', formatDate(selectedStudent.dateOfBirth)], ['Date of Baptism', formatDate(selectedStudent.dateOfBaptism)],
                ['Holy Communion', formatDate(selectedStudent.dateOfHolyCommunion)], ['Father', selectedStudent.fatherName],
                ['Father Baptism', selectedStudent.fatherBaptismName || 'N/A'], ['Mother', selectedStudent.motherName],
                ['Mother Baptism', selectedStudent.motherBaptismName || 'N/A'], ['Email', selectedStudent.email],
                ['Phone', selectedStudent.phoneNumber],
              ].map(([label, value]) => (
                <Grid item xs={6} key={label}>
                  <Typography variant="caption" color="text.secondary">{label}</Typography>
                  <Typography variant="body2" fontWeight="medium">{value}</Typography>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          {selectedStudent?.status === 'pending' && (
            <>
              <Button onClick={() => { handleApprove(selectedStudent._id); setViewDialog(false); }}
                color="success" variant="contained" startIcon={<CheckCircle />}>Approve</Button>
              <Button onClick={() => { handleRejectClick(selectedStudent._id); setViewDialog(false); }}
                color="error" variant="contained" startIcon={<Cancel />}>Reject</Button>
            </>
          )}
          {selectedStudent && (
            <Button onClick={() => handleDownloadPDF(selectedStudent)} variant="outlined" startIcon={<PictureAsPdf />}>PDF</Button>
          )}
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog} onClose={() => setRejectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Registration</DialogTitle>
        <DialogContent>
          <TextField fullWidth multiline rows={4} value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)} placeholder="Rejection reason..." sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog(false)}>Cancel</Button>
          <Button onClick={handleRejectConfirm} color="error" variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
};

export default AdminRegistrations;