import React, { useState } from 'react';
import { X, Wallet, DollarSign, Calendar, FileText, Send, CheckCircle } from 'lucide-react';
import WalletConnect from './WalletConnect';

const CollaborationModal = ({ isOpen, onClose, creatorProfile }) => {
  const [step, setStep] = useState(1); // 1: Wallet, 2: Details, 3: Confirmation
  const [wallet, setWallet] = useState(null);
  const [collabDetails, setCollabDetails] = useState({
    budget: '',
    duration: '',
    description: '',
    deliverables: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleWalletConnected = (walletData) => {
    setWallet(walletData);
    if (walletData) {
      setStep(2);
    }
  };

  const handleSubmitDetails = (e) => {
    e.preventDefault();
    setStep(3);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('hexagon_token') || 
                    localStorage.getItem('token') || 
                    localStorage.getItem('jwt');

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/collaborations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          creatorId: creatorProfile._id || creatorProfile.accountId,
          walletAddress: wallet.address,
          walletType: wallet.type,
          network: wallet.network,
          budget: collabDetails.budget,
          duration: collabDetails.duration,
          description: collabDetails.description,
          deliverables: collabDetails.deliverables,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          onClose();
          resetModal();
        }, 3000);
      } else {
        throw new Error('Failed to submit collaboration request');
      }
    } catch (error) {
      console.error('Error submitting collaboration:', error);
      alert('Failed to submit collaboration request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetModal = () => {
    setStep(1);
    setWallet(null);
    setCollabDetails({
      budget: '',
      duration: '',
      description: '',
      deliverables: '',
    });
    setSubmitted(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Collaboration Request</h2>
            <p className="text-sm text-gray-500 mt-1">
              Partner with {creatorProfile?.username || 'creator'}
            </p>
          </div>
          <button
            onClick={() => {
              onClose();
              resetModal();
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Connect Wallet', icon: Wallet },
              { num: 2, label: 'Details', icon: FileText },
              { num: 3, label: 'Confirm', icon: CheckCircle },
            ].map((s, idx) => (
              <React.Fragment key={s.num}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      step >= s.num
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    <s.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs mt-2 text-gray-600">{s.label}</span>
                </div>
                {idx < 2 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded transition-colors ${
                      step > s.num ? 'bg-purple-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {submitted ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Request Sent!</h3>
              <p className="text-gray-600">
                Your collaboration request has been sent to {creatorProfile?.username}.
                <br />
                They will review and respond soon.
              </p>
            </div>
          ) : (
            <>
              {/* Step 1: Wallet Connection */}
              {step === 1 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Connect Your Wallet
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Connect your crypto wallet to enable secure payments for this collaboration.
                  </p>
                  <WalletConnect
                    onWalletConnected={handleWalletConnected}
                    currentWallet={wallet}
                  />
                </div>
              )}

              {/* Step 2: Collaboration Details */}
              {step === 2 && (
                <form onSubmit={handleSubmitDetails} className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Collaboration Details
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      Budget (USD)
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={collabDetails.budget}
                      onChange={(e) =>
                        setCollabDetails({ ...collabDetails, budget: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter your budget"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Duration
                    </label>
                    <select
                      required
                      value={collabDetails.duration}
                      onChange={(e) =>
                        setCollabDetails({ ...collabDetails, duration: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Select duration</option>
                      <option value="1-week">1 Week</option>
                      <option value="2-weeks">2 Weeks</option>
                      <option value="1-month">1 Month</option>
                      <option value="3-months">3 Months</option>
                      <option value="6-months">6 Months</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Description
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={collabDetails.description}
                      onChange={(e) =>
                        setCollabDetails({ ...collabDetails, description: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      placeholder="Describe your collaboration idea..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expected Deliverables
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={collabDetails.deliverables}
                      onChange={(e) =>
                        setCollabDetails({ ...collabDetails, deliverables: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      placeholder="e.g., 3 Instagram posts, 1 YouTube video..."
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                    >
                      Continue
                    </button>
                  </div>
                </form>
              )}

              {/* Step 3: Confirmation */}
              {step === 3 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Review & Confirm
                  </h3>

                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Wallet</span>
                      <span className="text-sm font-medium text-gray-900">
                        {wallet?.shortAddress} ({wallet?.type})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Budget</span>
                      <span className="text-sm font-medium text-gray-900">
                        ${collabDetails.budget}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Duration</span>
                      <span className="text-sm font-medium text-gray-900">
                        {collabDetails.duration}
                      </span>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900">
                      <strong>Note:</strong> This is a collaboration request. The creator will
                      review your proposal and respond. Payment will be processed only after
                      mutual agreement.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      disabled={isSubmitting}
                      className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleFinalSubmit}
                      disabled={isSubmitting}
                      className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Request
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollaborationModal;

