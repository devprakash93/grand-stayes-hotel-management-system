const Booking = require('../models/Booking');
const Room = require('../models/Room');

const getDashboardStats = async (req, res) => {
  try {
    const totalRooms = await Room.countDocuments();
    const availableRooms = await Room.countDocuments({ status: 'available' });
    const occupiedRooms = await Room.countDocuments({ status: 'booked' }); // or checked-in
    
    const occupancyRate = totalRooms === 0 ? 0 : ((occupiedRooms / totalRooms) * 100).toFixed(2);

    const totalBookings = await Booking.countDocuments();
    
    // Aggregate Total Revenue
    const revenueResult = await Booking.aggregate([
      { $match: { bookingStatus: { $ne: 'cancelled' } } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Aggregate Monthly Revenue Trends
    const monthlyRevenue = await Booking.aggregate([
      { $match: { bookingStatus: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          revenue: { $sum: "$totalPrice" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 12 }
    ]);

    res.json({
      totalRooms,
      availableRooms,
      occupiedRooms,
      occupancyRate: `${occupancyRate}%`,
      totalBookings,
      totalRevenue,
      monthlyRevenue: monthlyRevenue.map(m => ({
        label: `${m._id.month}/${m._id.year}`,
        revenue: m.revenue,
        bookings: m.count
      }))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getDashboardStats };
