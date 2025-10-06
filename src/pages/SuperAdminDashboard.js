// src/pages/SuperAdminDashboard.js - Complete Enhanced Version
import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Chip, Avatar,
  IconButton, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, TextField, InputAdornment, Menu, MenuItem, Dialog,
  DialogTitle, DialogContent, DialogActions, Alert, CircularProgress,
  Tabs, Tab
} from '@mui/material';
import {
  People, AttachMoney, Church, Search, MoreVert, TrendingUp, TrendingDown,
  Group, Assignment, Edit, Delete, Block, CheckCircle, Download
} from '@mui/icons-material';
import { useHistory } from 'react-router-dom';
import axiosInstance from '../axiosConfig';

const SuperAdminDashboard = () => {
  const history = useHistory();
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adminData, setAdminData] = useState([]);
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  
  const [dailyStats, setDailyStats] = useState(null);
  const [rangeStats, setRangeStats] = useState(null);
  const [familyCompletion, setFamilyCompletion] = useState(null);
  const [parishStats, setParishStats] = useState(null);
  const [paymentAnalysis, setPaymentAnalysis] = useState(null);
  const [typeAnalysis, setTypeAnalysis] = useState(null);
  const [topFamilies, setTopFamilies] = useState(null);
  const [monthlyComparison, setMonthlyComparison] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const [stats, setStats] = useState({
    totalAdmins: 0,
    activeAdmins: 0,
    totalParishes: 0,
    totalFamilies: 0,
    totalTransactions: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    fetchDashboardData();
    fetchDailyStats();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [adminsResponse, statsResponse] = await Promise.all([
        axiosInstance.get('/admin/list'),
        axiosInstance.get('/admin/statistics')
      ]);
      setAdminData(adminsResponse.data || []);
      setStats(statsResponse.data || stats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyStats = async (date = selectedDate) => {
    try {
      setLoadingAnalytics(true);
      const response = await axiosInstance.get(`/analytics/daily-stats?date=${date}`);
      setDailyStats(response.data);
    } catch (error) {
      console.error('Error fetching daily stats:', error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const fetchAllAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      const [range, family, parish, payment, type, top, monthly] = await Promise.all([
        axiosInstance.get(`/analytics/date-range-stats?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
        axiosInstance.get(`/analytics/family-completion?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
        axiosInstance.get(`/analytics/parish-stats?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
        axiosInstance.get(`/analytics/payment-analysis?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
        axiosInstance.get(`/analytics/type-analysis?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
        axiosInstance.get(`/analytics/top-families?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&limit=20`),
        axiosInstance.get(`/analytics/monthly-comparison?year=${new Date().getFullYear()}`)
      ]);

      setRangeStats(range.data);
      setFamilyCompletion(family.data);
      setParishStats(parish.data);
      setPaymentAnalysis(payment.data);
      setTypeAnalysis(type.data);
      setTopFamilies(top.data);
      setMonthlyComparison(monthly.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    fetchDailyStats(e.target.value);
  };

  const handleRangeChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const handleMenuOpen = (event, admin) => {
    setAnchorEl(event.currentTarget);
    setSelectedAdmin(admin);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAdmin(null);
  };

  const handleDeleteAdmin = async () => {
    if (window.confirm('Are you sure you want to delete this admin?')) {
      try {
        await axiosInstance.delete(`/admin/${selectedAdmin._id}`);
        fetchDashboardData();
        handleMenuClose();
      } catch (error) {
        console.error('Error deleting admin:', error);
      }
    }
  };

  const handleToggleStatus = async () => {
    try {
      await axiosInstance.patch(`/admin/${selectedAdmin._id}/toggle-status`);
      fetchDashboardData();
      handleMenuClose();
    } catch (error) {
      console.error('Error toggling admin status:', error);
    }
  };

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).map(v => `"${v}"`).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color="text.secondary" variant="body2" gutterBottom>{title}</Typography>
            <Typography variant="h4" fontWeight="bold">{value}</Typography>
          </Box>
          <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>{icon}</Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  const filteredAdmins = adminData.filter(admin =>
    admin.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>Super Admin Dashboard</Typography>
        <Typography variant="body1" color="text.secondary">Comprehensive analytics and management</Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}><StatCard title="Total Admins" value={stats.totalAdmins} icon={<People />} color="primary.main" /></Grid>
        <Grid item xs={12} sm={6} md={2}><StatCard title="Active Admins" value={stats.activeAdmins} icon={<CheckCircle />} color="success.main" /></Grid>
        <Grid item xs={12} sm={6} md={2}><StatCard title="Parishes" value={stats.totalParishes} icon={<Church />} color="info.main" /></Grid>
        <Grid item xs={12} sm={6} md={2}><StatCard title="Families" value={stats.totalFamilies} icon={<Group />} color="warning.main" /></Grid>
        <Grid item xs={12} sm={6} md={2}><StatCard title="Transactions" value={stats.totalTransactions} icon={<Assignment />} color="secondary.main" /></Grid>
        <Grid item xs={12} sm={6} md={2}><StatCard title="Revenue" value={`₹${stats.totalRevenue?.toLocaleString()}`} icon={<AttachMoney />} color="success.dark" /></Grid>
      </Grid>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" fontWeight="bold" gutterBottom>Transaction Analytics</Typography>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} variant="scrollable" scrollButtons="auto">
              <Tab label="Daily Stats" />
              <Tab label="Date Range" />
              <Tab label="Family Completion" />
              <Tab label="Parish Analysis" />
              <Tab label="Payment Methods" />
              <Tab label="Transaction Types" />
              <Tab label="Top Families" />
              <Tab label="Monthly Trends" />
              <Tab label="Admin Management" />
            </Tabs>
          </Box>

          {tabValue === 0 && (
            <Box>
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField type="date" label="Select Date" value={selectedDate} onChange={handleDateChange} InputLabelProps={{ shrink: true }} />
                <Button variant="outlined" onClick={() => fetchDailyStats(selectedDate)} disabled={loadingAnalytics}>Refresh</Button>
              </Box>
              {loadingAnalytics ? <CircularProgress /> : dailyStats ? (
                <>
                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={3}><Card sx={{ bgcolor: 'primary.light', color: 'white' }}><CardContent><Typography variant="body2">Transactions</Typography><Typography variant="h4">{dailyStats.totalTransactions}</Typography></CardContent></Card></Grid>
                    <Grid item xs={12} md={3}><Card sx={{ bgcolor: 'success.light', color: 'white' }}><CardContent><Typography variant="body2">Amount</Typography><Typography variant="h4">₹{dailyStats.totalAmount?.toLocaleString()}</Typography></CardContent></Card></Grid>
                    <Grid item xs={12} md={3}><Card sx={{ bgcolor: 'info.light', color: 'white' }}><CardContent><Typography variant="body2">Families</Typography><Typography variant="h4">{dailyStats.uniqueFamilies}</Typography></CardContent></Card></Grid>
                    <Grid item xs={12} md={3}><Card sx={{ bgcolor: 'warning.light', color: 'white' }}><CardContent><Typography variant="body2">Average</Typography><Typography variant="h4">₹{dailyStats.totalTransactions > 0 ? (dailyStats.totalAmount / dailyStats.totalTransactions).toFixed(0) : 0}</Typography></CardContent></Card></Grid>
                  </Grid>
                  {dailyStats.transactions?.length > 0 && (
                    <TableContainer component={Paper}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Receipt</TableCell>
                            <TableCell>Time</TableCell>
                            <TableCell>Family</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell align="right">Amount</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {dailyStats.transactions.map(t => (
                            <TableRow key={t.id}>
                              <TableCell>{t.receiptNumber}</TableCell>
                              <TableCell>{t.time || 'N/A'}</TableCell>
                              <TableCell>Family #{t.familyCode}</TableCell>
                              <TableCell><Chip label={t.transactionType} size="small" /></TableCell>
                              <TableCell align="right">₹{Number(t.amount || 0).toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </>
              ) : <Alert severity="info">No data for selected date</Alert>}
            </Box>
          )}

          {tabValue === 1 && (
            <Box>
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField type="date" label="Start" value={dateRange.startDate} onChange={(e) => handleRangeChange('startDate', e.target.value)} InputLabelProps={{ shrink: true }} />
                <TextField type="date" label="End" value={dateRange.endDate} onChange={(e) => handleRangeChange('endDate', e.target.value)} InputLabelProps={{ shrink: true }} />
                <Button variant="contained" onClick={fetchAllAnalytics} disabled={loadingAnalytics}>Analyze</Button>
              </Box>
              {loadingAnalytics ? <CircularProgress /> : rangeStats && (
                <>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={3}><Card><CardContent><Typography color="text.secondary">Transactions</Typography><Typography variant="h4">{rangeStats.totalTransactions}</Typography></CardContent></Card></Grid>
                    <Grid item xs={3}><Card><CardContent><Typography color="text.secondary">Revenue</Typography><Typography variant="h4">₹{rangeStats.totalAmount?.toLocaleString()}</Typography></CardContent></Card></Grid>
                    <Grid item xs={3}><Card><CardContent><Typography color="text.secondary">Families</Typography><Typography variant="h4">{rangeStats.uniqueFamilies}</Typography></CardContent></Card></Grid>
                    <Grid item xs={3}><Card><CardContent><Typography color="text.secondary">Parishes</Typography><Typography variant="h4">{Object.keys(rangeStats.byParish || {}).length}</Typography></CardContent></Card></Grid>
                  </Grid>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead><TableRow><TableCell>Date</TableCell><TableCell align="right">Transactions</TableCell><TableCell align="right">Amount</TableCell><TableCell align="right">Families</TableCell></TableRow></TableHead>
                      <TableBody>
                        {Object.entries(rangeStats.byDate || {}).map(([date, data]) => (
                          <TableRow key={date}>
                            <TableCell>{new Date(date).toLocaleDateString()}</TableCell>
                            <TableCell align="right">{data.count}</TableCell>
                            <TableCell align="right">₹{data.amount?.toLocaleString()}</TableCell>
                            <TableCell align="right">{data.familyCount}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </Box>
          )}

          {tabValue === 2 && familyCompletion && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={3}><Card sx={{ bgcolor: 'primary.main', color: 'white' }}><CardContent><Typography>Total</Typography><Typography variant="h4">{familyCompletion.summary.totalFamilies}</Typography></CardContent></Card></Grid>
                <Grid item xs={3}><Card sx={{ bgcolor: 'success.main', color: 'white' }}><CardContent><Typography>Completed</Typography><Typography variant="h4">{familyCompletion.summary.completedFamilies}</Typography></CardContent></Card></Grid>
                <Grid item xs={3}><Card sx={{ bgcolor: 'warning.main', color: 'white' }}><CardContent><Typography>Pending</Typography><Typography variant="h4">{familyCompletion.summary.pendingFamilies}</Typography></CardContent></Card></Grid>
                <Grid item xs={3}><Card sx={{ bgcolor: 'info.main', color: 'white' }}><CardContent><Typography>Rate</Typography><Typography variant="h4">{familyCompletion.summary.completionRate}%</Typography></CardContent></Card></Grid>
              </Grid>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6">Family Details</Typography>
                <Button variant="outlined" startIcon={<Download />} onClick={() => exportToCSV(familyCompletion.families, 'families')}>Export</Button>
              </Box>
              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table size="small" stickyHeader>
                  <TableHead><TableRow><TableCell>Code</TableCell><TableCell>Name</TableCell><TableCell>Parish</TableCell><TableCell align="right">Transactions</TableCell><TableCell align="right">Amount</TableCell></TableRow></TableHead>
                  <TableBody>
                    {familyCompletion.families?.map(f => (
                      <TableRow key={f.familyId}>
                        <TableCell>{f.familyCode}</TableCell>
                        <TableCell>{f.familyName}</TableCell>
                        <TableCell>{f.parishName}</TableCell>
                        <TableCell align="right">{f.totalTransactions}</TableCell>
                        <TableCell align="right">₹{f.totalAmount?.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {tabValue === 3 && parishStats && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead><TableRow><TableCell>Parish</TableCell><TableCell align="right">Transactions</TableCell><TableCell align="right">Amount</TableCell><TableCell align="right">Families</TableCell><TableCell align="right">Average</TableCell></TableRow></TableHead>
                <TableBody>
                  {parishStats.parishStats?.map((p, i) => (
                    <TableRow key={i}>
                      <TableCell><strong>{p.parish}</strong></TableCell>
                      <TableCell align="right">{p.totalTransactions}</TableCell>
                      <TableCell align="right">₹{p.totalAmount?.toLocaleString()}</TableCell>
                      <TableCell align="right">{p.uniqueFamilies}</TableCell>
                      <TableCell align="right">₹{p.averagePerTransaction}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {tabValue === 4 && paymentAnalysis && (
            <Grid container spacing={2}>
              {paymentAnalysis.paymentMethods?.map((pm, i) => (
                <Grid item xs={12} md={6} key={i}>
                  <Card><CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Box><Typography variant="h6">{pm.method}</Typography><Typography color="text.secondary">{pm.count} transactions</Typography></Box>
                      <Box sx={{ textAlign: 'right' }}><Typography variant="h5">₹{pm.totalAmount?.toLocaleString()}</Typography><Typography variant="caption">Avg: ₹{pm.averageAmount}</Typography></Box>
                    </Box>
                  </CardContent></Card>
                </Grid>
              ))}
            </Grid>
          )}

          {tabValue === 5 && typeAnalysis && (
            <Grid container spacing={2}>
              {typeAnalysis.transactionTypes?.map((tt, i) => (
                <Grid item xs={12} md={6} key={i}>
                  <Card><CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Box><Chip label={tt.type} color="primary" /><Typography>{tt.count} transactions</Typography></Box>
                      <Box sx={{ textAlign: 'right' }}><Typography variant="h5">₹{tt.totalAmount?.toLocaleString()}</Typography><Typography variant="caption">Avg: ₹{tt.averageAmount}</Typography></Box>
                    </Box>
                  </CardContent></Card>
                </Grid>
              ))}
            </Grid>
          )}

          {tabValue === 6 && topFamilies && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead><TableRow><TableCell>Rank</TableCell><TableCell>Family</TableCell><TableCell>Parish</TableCell><TableCell align="right">Transactions</TableCell><TableCell align="right">Amount</TableCell></TableRow></TableHead>
                <TableBody>
                  {topFamilies.topFamilies?.map((f, i) => (
                    <TableRow key={f.familyId}>
                      <TableCell><strong>#{i + 1}</strong></TableCell>
                      <TableCell>{f.familyName} ({f.familyCode})</TableCell>
                      <TableCell>{f.parishName}</TableCell>
                      <TableCell align="right">{f.transactionCount}</TableCell>
                      <TableCell align="right"><strong>₹{f.totalAmount?.toLocaleString()}</strong></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {tabValue === 7 && monthlyComparison && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead><TableRow><TableCell>Month</TableCell><TableCell align="right">Transactions</TableCell><TableCell align="right">Amount</TableCell></TableRow></TableHead>
                <TableBody>
                  {monthlyComparison.monthlyData?.map(m => (
                    <TableRow key={m.monthNumber}>
                      <TableCell><strong>{m.month}</strong></TableCell>
                      <TableCell align="right">{m.transactions}</TableCell>
                      <TableCell align="right">₹{m.amount?.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {tabValue === 8 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <TextField placeholder="Search admins..." size="small" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} sx={{ width: 300 }} />
                <Button variant="contained" startIcon={<People />} onClick={() => history.push('/sign-up')}>Add Admin</Button>
              </Box>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Email</TableCell><TableCell>Role</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
                  <TableBody>
                    {filteredAdmins.map(admin => (
                      <TableRow key={admin._id}>
                        <TableCell><Box sx={{ display: 'flex', alignItems: 'center' }}><Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>{admin.name?.charAt(0)}</Avatar>{admin.name}</Box></TableCell>
                        <TableCell>{admin.email}</TableCell>
                        <TableCell><Chip label={admin.role} color={admin.role === 'superadmin' ? 'error' : 'primary'} size="small" /></TableCell>
                        <TableCell><Chip label={admin.isActive ? 'Active' : 'Inactive'} color={admin.isActive ? 'success' : 'default'} size="small" /></TableCell>
                        <TableCell align="right"><IconButton size="small" onClick={(e) => handleMenuOpen(e, admin)}><MoreVert /></IconButton></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </CardContent>
      </Card>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => { setDialogOpen(true); handleMenuClose(); }}><Edit sx={{ mr: 1 }} />Edit</MenuItem>
        <MenuItem onClick={handleToggleStatus}><Block sx={{ mr: 1 }} />{selectedAdmin?.isActive ? 'Deactivate' : 'Activate'}</MenuItem>
        <MenuItem onClick={handleDeleteAdmin} sx={{ color: 'error.main' }}><Delete sx={{ mr: 1 }} />Delete</MenuItem>
      </Menu>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Edit Admin</DialogTitle>
        <DialogContent><Alert severity="info">Feature coming soon</Alert></DialogContent>
        <DialogActions><Button onClick={() => setDialogOpen(false)}>Close</Button></DialogActions>
      </Dialog>
    </Box>
  );
};

export default SuperAdminDashboard;