export interface User {
  uid: string;
  name: string;
  email: string;
  role: 'student' | 'organizer' | 'admin' | 'canteen';
  phone?: string;
  college?: string;
  course?: string;
  interests: string[];
  points: number;
  badges: string[];
  societyId?: string; // For organizers
  followedSocieties: string[];
  photoURL?: string;
  vendorName?: string; // For canteen
  organisation?: string; // For organizers
  upiId?: string; // For canteen
  razorpayId?: string; // For canteen
  status?: 'pending' | 'approved' | 'rejected';
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  venue: string;
  organizerId: string;
  category: string;
  type: 'free' | 'paid';
  fee?: number;
  couponCost?: number;
  maxCoupons?: number;
  registrationLimit: number;
  registeredCount: number;
  posterUrl?: string;
  slug: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  hasFoodCoupon: boolean;
  isCanteenPaymentDone?: boolean;
  createdAt?: any;
  // QR Control
  qrVisible: boolean;
  qrExpiry?: string;
  qrScanLimit?: number;
  couponsDistributed?: boolean;
}

export interface Registration {
  id: string;
  userId: string;
  eventId: string;
  status: 'pending' | 'confirmed' | 'rejected';
  paymentId?: string;
  transactionId?: string;
  paymentScreenshot?: string;
  ticketId?: string;
  attended: boolean;
  couponRedeemed: boolean;
  couponActive?: boolean;
  qrCode?: string;
  scannedAt?: any;
  validationToken?: string;
}

export interface Attendance {
  id: string;
  userId: string;
  eventId: string;
  scanTime: string;
  verifiedBy: string;
}

export interface CouponRedemption {
  id: string;
  userId: string;
  eventId: string;
  redeemedAt: string;
  vendorId: string;
}

export interface CanteenPayment {
  id: string;
  eventId: string;
  eventTitle: string;
  organizerId: string;
  vendorId: string;
  amount: number;
  studentCount: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  timestamp: string;
  razorpayPaymentId?: string;
  upiTransactionId?: string;
  requestedAt: string;
  paidAt?: string;
  paymentScreenshot?: string;
}

export interface Society {
  id: string;
  name: string;
  description: string;
  category: string;
  logoUrl?: string;
  bannerUrl?: string;
  followerCount: number;
  organizerId: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: any;
}
