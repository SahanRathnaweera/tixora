export type Role = 'ADMIN' | 'USER';
export type BookingStatus = 'CONFIRMED' | 'CANCELLED';

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
  createdAt: string;
  ticket: Ticket | null;
}

export interface VerifyResult {
  ticketId: number;
  bookingId: number;
  eventTitle: string;
  holderName: string;
  bookedSeats: number;
  verifiedAt: string;
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

export interface EventInput {
  title: string;
  description: string;
  eventDate: string;
  location: string;
  price: number;
  totalSeats: number;
  imageUrl: string;
}