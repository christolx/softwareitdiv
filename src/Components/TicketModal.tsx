import React, { useState, useEffect } from 'react';
import { fetchWithToken } from '../utils/api';
import PaymentModal from './PaymentModal';
import moviePoster from '../assets/pexels-tima-miroshnichenko-7991158.jpg';

interface TicketModalProps {
    ticketId: string;
    onClose: () => void;
}

const TicketModal: React.FC<TicketModalProps> = ({ ticketId, onClose }) => {
    const [ticket, setTicket] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
    const [paymentVaNumber, setPaymentVaNumber] = useState<string | null>(null);
    const [orderId, setOrderId] = useState<string>('');

    useEffect(() => {
        setLoading(true);
        setError(null);

        if (ticketId) {
            fetchWithToken(`http://localhost:3000/TicketGroup/get-group-ticket/${ticketId}`)
                .then((response) => response.json())
                .then((data) => {
                    if (data.message) {
                        setError(data.message);
                        setTicket(null);
                    } else {
                        setTicket(data);
                    }
                    setLoading(false);
                })
                .catch((err) => {
                    console.error('Error fetching ticket:', err);
                    setError('Failed to fetch ticket');
                    setLoading(false);
                });
        }
    }, [ticketId]);

    const handlePayment = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetchWithToken('http://localhost:3000/payments/check-ticket-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ticket_id: ticketId,
                }),
            });

            const data = await response.json();

            if (response.status === 400) {
                setError(data.message);
                return;
            }

            if (data.message === 'Ticket is available for booking.') {
                const paymentResponse = await fetchWithToken('http://localhost:3000/transaction/create-transaction', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ticket_id: ticketId,
                        gross_amount: ticket.ticket_price,
                        bank: 'bca',
                    }),
                });

                if (!paymentResponse.ok) {
                    const paymentErrorMessage = `Payment Error: ${paymentResponse.status} - ${paymentResponse.statusText}`;
                    setError(paymentErrorMessage);
                    return;
                }

                const paymentData = await paymentResponse.json();

                if (paymentData.order_id) {
                    setOrderId(paymentData.order_id);
                    const vaNumber = paymentData.transaction?.va_numbers?.[0]?.va_number;

                    if (vaNumber) {
                        setPaymentVaNumber(vaNumber);
                        setShowPaymentModal(true);
                    } else {
                        setError('Bank transfer details not available.');
                    }
                } else {
                    setError('Transaction failed: No order_id received from backend');
                }
            }
        } catch (error) {
            const errorMessage = 'Error processing transaction: ' + (error as Error).message;
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTicket = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetchWithToken(`http://localhost:3000/TicketGroup/delete-group-ticket/${ticketId}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (response.status === 200) {
                
                onClose();
            } else {
                setError(data.message || 'Failed to delete ticket');
            }
        } catch (error) {
            const errorMessage = 'Error deleting ticket: ' + (error as Error).message;
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseError = () => {
        setError(null);
        onClose();
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-white p-8 rounded-lg shadow-xl text-center text-black">
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="relative bg-gray-900 rounded-3xl shadow-2xl w-11/12 max-w-3xl overflow-hidden">
                <div className="relative">
                    <img
                        src={moviePoster}
                        alt={ticket?.movie_name || 'Movie Poster'}
                        className="w-full h-64 object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50"></div>
                </div>

                <div className="relative px-6 py-8 text-white">

                    <div className="space-y-6">
                        <h2 className="text-4xl font-bold text-white text-center">
                            {ticket?.movie_name || 'Loading...'}
                        </h2>

                        <div className="space-y-4">
                            <div className="flex justify-between text-lg">
                                <span className="font-semibold">Theater:</span>
                                <span>{ticket?.theater_name || 'N/A'}</span>
                            </div>

                            <div className="flex justify-between text-lg">
                                <span className="font-semibold">Showtime:</span>
                                <span>{ticket?.showtime || 'N/A'}</span>
                            </div>

                            <div className="flex justify-between text-lg">
                                <span className="font-semibold">Seat Number:</span>
                                <span>{ticket?.seat_number || 'N/A'}</span>
                            </div>

                            <div className="flex justify-between text-lg">
                                <span className="font-semibold">Ticket Price:</span>
                                <span className="text-green-600 font-semibold">Rp{ticket?.ticket_price || 0}</span>
                            </div>

                            <div className="flex justify-between text-lg">
                                <span className="font-semibold">Status:</span>
                                <span
                                    className={`font-semibold ${ticket?.status === 'Completed' ? 'text-green-600' : 'text-red-600'}`}
                                >
                                    {ticket?.status || 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center space-x-4 mt-8">
                        <button
                            onClick={handlePayment}
                            className="px-8 py-3 bg-green-600 text-white rounded-full shadow-lg transform transition duration-300 hover:bg-green-500 hover:scale-105"
                            disabled={loading}
                        >
                            Pay Now
                        </button>

                        <button
                            onClick={handleDeleteTicket}  
                            className="px-8 py-3 bg-red-600 text-white rounded-full shadow-lg transform transition duration-300 hover:bg-red-500 hover:scale-105"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="absolute bottom-0 left-0 right-0 bg-red-600 text-white text-center py-4">
                        <p className="text-sm">{error}</p>
                        <button
                            onClick={handleCloseError}
                            className="mt-2 px-4 py-1 bg-red-700 text-white rounded-full text-sm"
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>

            {showPaymentModal && paymentVaNumber && (
                <PaymentModal
                    vaNumber={paymentVaNumber}
                    orderId={orderId}
                    onClose={() => setShowPaymentModal(false)}
                    isOpen={showPaymentModal}
                />
            )}
        </div>
    );
};

export default TicketModal;
