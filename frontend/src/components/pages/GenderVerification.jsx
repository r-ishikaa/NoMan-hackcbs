import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, X, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import API_CONFIG from '../../config/api'

const GenderVerification = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState('intro') // intro, camera, verifying, result
  const [stream, setStream] = useState(null)
  const [capturedImage, setCapturedImage] = useState(null)
  const [verificationResult, setVerificationResult] = useState(null)
  const [error, setError] = useState('')
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  const startCamera = async () => {
    try {
      setError('')
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play()
      }
      
      setStream(mediaStream)
      setStep('camera')
    } catch (err) {
      console.error('Camera access error:', err)
      setError('Unable to access camera. Please allow camera permissions and try again.')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)
    
    canvas.toBlob(async (blob) => {
      if (!blob) {
        setError('Failed to capture image. Please try again.')
        return
      }

      const imageUrl = URL.createObjectURL(blob)
      setCapturedImage(imageUrl)
      stopCamera()
      
      // Verify with Gemini AI
      await verifyGender(blob)
    }, 'image/jpeg', 0.95)
  }

  const verifyGender = async (imageBlob) => {
    setStep('verifying')
    setError('')

    try {
      const formData = new FormData()
      formData.append('image', imageBlob, 'selfie.jpg')

      const response = await fetch(API_CONFIG.getApiUrl('/auth/verify-gender'), {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed')
      }

      setVerificationResult(data)
      setStep('result')

      // If verified as female, proceed to signup after 2 seconds
      if (data.isVerified && data.gender === 'female') {
        setTimeout(() => {
          navigate('/signup', { state: { genderVerified: true } })
        }, 2000)
      }
    } catch (err) {
      console.error('Verification error:', err)
      setError(err.message || 'Verification failed. Please try again.')
      setStep('intro')
      setCapturedImage(null)
    }
  }

  const retakePhoto = () => {
    setCapturedImage(null)
    setVerificationResult(null)
    setError('')
    setStep('intro')
  }

  return (
    <section className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Intro Step */}
        {step === 'intro' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Camera className="w-10 h-10 text-white" />
              </div>
              
              <h1 className="text-3xl font-bold text-white mb-3">Gender Verification</h1>
              <p className="text-gray-200 mb-6">
                To ensure a safe community, we need to verify your identity. Please take a selfie to continue.
              </p>
              
              <div className="bg-white/10 rounded-2xl p-4 mb-6 text-left">
                <h3 className="text-white font-semibold mb-2">Guidelines:</h3>
                <ul className="text-gray-200 text-sm space-y-2">
                  <li>• Make sure your face is clearly visible</li>
                  <li>• Use good lighting</li>
                  <li>• Remove sunglasses or masks</li>
                  <li>• Look directly at the camera</li>
                </ul>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-white text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={startCamera}
                className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full font-semibold transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                Start Verification
              </button>

              <button
                onClick={() => navigate('/login')}
                className="w-full mt-3 px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-medium transition-all"
              >
                Back to Login
              </button>
            </div>
          </div>
        )}

        {/* Camera Step */}
        {step === 'camera' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full aspect-[3/4] object-cover bg-black"
              />
              
              {/* Overlay guide */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-80 border-4 border-white/50 rounded-full"></div>
              </div>

              {/* Instructions */}
              <div className="absolute top-4 left-0 right-0 text-center">
                <p className="text-white font-semibold bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full inline-block">
                  Position your face in the circle
                </p>
              </div>
            </div>

            <div className="p-6 space-y-3">
              <button
                onClick={capturePhoto}
                className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full font-semibold transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                Capture Photo
              </button>

              <button
                onClick={() => {
                  stopCamera()
                  setStep('intro')
                }}
                className="w-full px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-medium transition-all flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Verifying Step */}
        {step === 'verifying' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
            <div className="text-center">
              {capturedImage && (
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-48 h-48 object-cover rounded-full mx-auto mb-6 border-4 border-white/30"
                />
              )}

              <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
              
              <h2 className="text-2xl font-bold text-white mb-2">Verifying...</h2>
              <p className="text-gray-200">
                Please wait while we verify your identity using AI
              </p>
            </div>
          </div>
        )}

        {/* Result Step */}
        {step === 'result' && verificationResult && (
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
            <div className="text-center">
              {capturedImage && (
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-48 h-48 object-cover rounded-full mx-auto mb-6 border-4 border-white/30"
                />
              )}

              {verificationResult.isVerified && verificationResult.gender === 'female' ? (
                <>
                  <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-12 h-12 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">Verification Successful!</h2>
                  <p className="text-gray-200 mb-6">
                    Welcome! Redirecting you to signup...
                  </p>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-12 h-12 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">Verification Failed</h2>
                  <p className="text-gray-200 mb-6">
                    {verificationResult.message || 'Sorry, we could not verify your identity. This platform is currently only available for women.'}
                  </p>
                  
                  <div className="space-y-3">
                    <button
                      onClick={retakePhoto}
                      className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full font-semibold transition-all transform hover:scale-105 shadow-lg"
                    >
                      Try Again
                    </button>

                    <button
                      onClick={() => navigate('/login')}
                      className="w-full px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-medium transition-all"
                    >
                      Back to Login
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Hidden canvas for capturing */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </section>
  )
}

export default GenderVerification

