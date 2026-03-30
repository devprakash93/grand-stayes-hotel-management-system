const calculateTotalPrice = (pricePerNight, checkInDate, checkOutDate) => {
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  const diffTime = Math.abs(checkOut - checkIn);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  
  if (diffDays <= 0) return pricePerNight; // minimum 1 night charge
  return pricePerNight * diffDays;
};

module.exports = { calculateTotalPrice };
