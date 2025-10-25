import React, { useState } from 'react';
import { QrCode, MoreVertical, Eye, Smartphone, Download, Trash2 } from 'lucide-react';
import LPAQRCodeDisplay from './LPAQRCodeDisplay';
import { useI18n } from '../../contexts/I18nContext';
import { convertAndFormatPrice } from '../../services/currencyService';

const QRCodeModal = ({ 
  show, 
  selectedOrder, 
  onClose, 
  onCheckEsimDetails, 
  onCheckEsimUsage, 
  onDelete,
  loadingEsimDetails, 
  loadingEsimUsage 
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const { locale: contextLocale } = useI18n();
  // Force Russian locale for QR modal
  const locale = 'ru';

  if (!show || !selectedOrder) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="relative max-w-md w-full mx-4">
        <div className="absolute inset-px rounded-xl bg-gray-800/90 backdrop-blur-md"></div>
        <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
          <div className="px-8 pt-8 pb-8">
            <div className="text-center">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-medium text-white">eSIM QR Code</h3>
                <button
                  onClick={onClose}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
          
              <div className="mb-6">
                <h4 className="font-medium text-white mb-2">{selectedOrder.planName || 'Unknown Plan'}</h4>
                <p className="text-sm text-gray-300">Order #{selectedOrder.orderId || selectedOrder.id || 'Unknown'}</p>
                <p className="text-sm text-gray-300">
                  {convertAndFormatPrice(selectedOrder.amount || 0, locale).formatted}
                </p>
              </div>

              {/* QR Code Display - Clean and Simple */}
              <div className="bg-gray-700/30 p-6 rounded-lg mb-6">
                {console.log('🔍 QR Code data for display:', selectedOrder.qrCode)}
                {console.log('🔍 Full selectedOrder:', selectedOrder)}
                {selectedOrder.qrCode && selectedOrder.qrCode.qrCode ? (
                  // Show the actual QR code from LPA data (contains "Add Cellular Plan")
                  <div className="text-center">
                    <div className="w-64 h-64 mx-auto bg-white p-4 rounded-lg border-2 border-green-300 shadow-sm">
                      <LPAQRCodeDisplay lpaData={selectedOrder.qrCode.qrCode} />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">✅ Real QR Code (Add Cellular Plan)</p>
                    <p className="text-xs text-gray-400 mt-1 break-all">QR Data: {selectedOrder.qrCode.qrCode?.substring(0, 50)}...</p>
                  </div>
                ) : selectedOrder.qrCode && selectedOrder.qrCode.qrCodeUrl ? (
                  // Fallback: Show QR code image from URL
                  <div className="text-center">
                    <div className="w-64 h-64 mx-auto bg-white p-4 rounded-lg border-2 border-blue-300 shadow-sm">
                      <img 
                        src={selectedOrder.qrCode.qrCodeUrl} 
                        alt="eSIM QR Code" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">✅ QR Code Image</p>
                  </div>
                ) : selectedOrder.qrCode && selectedOrder.qrCode.directAppleInstallationUrl ? (
                  // Show Apple installation link
                  <div className="text-center">
                    <div className="w-64 h-64 mx-auto bg-white p-4 rounded-lg border-2 border-purple-300 shadow-sm flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-2xl">📱</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">Apple eSIM Installation</p>
                        <a 
                          href={selectedOrder.qrCode.directAppleInstallationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block px-4 py-2 bg-purple-500 text-white text-sm rounded hover:bg-purple-600"
                        >
                          Install eSIM
                        </a>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">✅ Direct Apple Installation Link</p>
                  </div>
                ) : (
                  // Fallback - no QR code available
                  <div className="text-center">
                    <div className="w-64 h-64 mx-auto bg-white p-4 rounded-lg border-2 border-gray-300 shadow-sm">
                      <div className="w-full h-full flex items-center justify-center">
                        <QrCode className="w-32 h-32 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        {selectedOrder.qrCode?.fallbackReason?.includes('not available yet') 
                          ? 'QR code is being generated...' 
                          : selectedOrder.qrCode?.fallbackReason || 'No QR code available'}
                      </p>
                      {selectedOrder.qrCode?.canRetry && (
                        <p className="text-xs text-blue-600 mt-1">Click "Generate QR Code" to try again</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {/* Actions Dropdown Menu */}
                <div className="relative dropdown-container">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
                  >
                    <MoreVertical className="w-4 h-4 mr-2" />
                    Действия
                  </button>
                  
                  {showDropdown && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10">
                      {/* Open in Apple eSIM */}
                      {selectedOrder.qrCode && selectedOrder.qrCode.directAppleInstallationUrl && (
                        <button
                          onClick={() => {
                            setShowDropdown(false);
                            window.open(selectedOrder.qrCode.directAppleInstallationUrl, '_blank', 'noopener,noreferrer');
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors flex items-center"
                        >
                          <Smartphone className="w-4 h-4 mr-3 text-orange-400" />
                          <span className="text-gray-300">Открыть в Apple eSIM</span>
                        </button>
                      )}

                      {/* Download QR Code */}
                      {selectedOrder.qrCode && selectedOrder.qrCode.qrCodeUrl && (
                        <button
                          onClick={() => {
                            setShowDropdown(false);
                            const link = document.createElement('a');
                            link.href = selectedOrder.qrCode.qrCodeUrl;
                            link.download = `esim-qr-${selectedOrder.orderId || selectedOrder.id}.png`;
                            link.click();
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors flex items-center"
                        >
                          <Download className="w-4 h-4 mr-3 text-blue-400" />
                          <span className="text-gray-300">Скачать QR код</span>
                        </button>
                      )}

                      {/* Remove eSIM */}
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          if (window.confirm('Вы уверены, что хотите удалить этот eSIM? Это действие нельзя отменить.')) {
                            onDelete();
                          }
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-red-900/30 transition-colors flex items-center border-t border-gray-700"
                      >
                        <Trash2 className="w-4 h-4 mr-3 text-red-400" />
                        <span className="text-red-400 font-medium">Удалить eSIM</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
      </div>
    </div>
  );
};

export default QRCodeModal;
