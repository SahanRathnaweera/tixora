export type Role = 'ADMIN' | 'USER';
export type BookingStatus = 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface EventItem {
  id: number;
  title: string;
  description: string | null;
  eventDate: string;
  location: string;
  price: number;
  totalSeats: number;
  availableSeats: number;
  imageUrl: string | null;
}

export interface EventInput {
  title: string;
  description: string;
  eventDate: string;
  location: string;
  price: number;
  totalSeats: number;
  imageUrl: string;
}

export interface Ticket {
  id: number;
  qrCodeData: string;
  qrCodeImage: string;
  verified: boolean;
  verifiedAt: string | null;
}

export interface Booking {
  id: number;
  eventId: number;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  eventImageUrl: string | null;
  bookedSeats: number;
  totalPrice: number;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  /** Seconds left to pay (only while the booking is waiting for payment). */
  holdSecondsLeft: number | null;
  paidAt: string | null;
  paymentReference: string | null;
  cardLast4: string | null;
  createdAt: string;
  ticket: Ticket | null;
}

export interface PaymentInput {
  cardHolder: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
}

export interface VerifyResult {
  ticketId: number;
  bookingId: number;
  eventTitle: string;
  holderName: string;
  bookedSeats: number;
  verifiedAt: string;
}