import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Camera, Upload, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useOCR } from '../../hooks/useOCR';
import { useBudget } from '../../contexts/BudgetContextSupabase';
import { categorizeTransaction } from '../../utils/categorizer';
import { CategoryType, CategoryLabels, Transaction, CoreCategories, QuickAddCategories } from '../../types';
import { fadeIn, scaleIn } from '../../utils/animations';
import toast from 'react-hot-toast';

interface ReceiptUploaderProps {
  onClose: () => void;
  onSuccess?: (transaction: Transaction) => void;
}

interface ProcessedData {
  amount: number;
  merchant: string;
  category: CategoryType;
  description: string;
  date: Date;
}

const ReceiptUploader: React.FC<ReceiptUploaderProps> = ({ onClose, onSuccess }) => {
  const { addTransaction } = useBudget();
  const { processImage, isProcessing, progress, error } = useOCR();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [editingData, setEditingData] = useState<ProcessedData | null>(null);
  const [step, setStep] = useState<'upload' | 'processing' | 'review' | 'success'>('upload');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setStep('processing');

    try {
      const result = await processImage(file);

      // Process the OCR result
      const amount = result.amount || 0;
      const merchant = result.merchant || 'Unknown Merchant';
      const category = categorizeTransaction(result.merchant, result.text, amount);
      const description = result.merchant || `Receipt from ${new Date().toLocaleDateString()}`;
      const date = result.date || new Date();

      const processed: ProcessedData = {
        amount,
        merchant,
        category,
        description,
        date,
      };

      setProcessedData(processed);
      setEditingData({ ...processed });
      setStep('review');

      if (result.confidence > 70) {
        toast.success('Receipt processed successfully!');
      } else {
        toast('Receipt processed, please review the details', {
          icon: '⚠️',
        });
      }
    } catch (err) {
      toast.error('Failed to process receipt. Please try again.');
      setStep('upload');
    }
  }, [processImage]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleConfirm = () => {
    if (!editingData) return;

    const transaction: Omit<Transaction, 'id'> = {
      amount: editingData.amount,
      description: editingData.description,
      category: editingData.category,
      date: editingData.date,
      merchant: editingData.merchant,
      receiptImage: uploadedImage || undefined,
    };

    addTransaction(transaction);
    setStep('success');

    setTimeout(() => {
      toast.success('Transaction added successfully!');
      onSuccess?.(transaction as Transaction);
      onClose();
    }, 1500);
  };

  const handleEdit = (field: keyof ProcessedData, value: any) => {
    if (!editingData) return;
    setEditingData({ ...editingData, [field]: value });
  };

  const renderUploadStep = () => (
    <motion.div variants={fadeIn} className="text-center">
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-xl p-8 transition-colors cursor-pointer ${
          isDragActive ? 'border-mint-500 bg-mint-50' : 'border-gray-300 hover:border-mint-400'
        }`}
      >
        <input {...getInputProps()} />
        <motion.div
          animate={{ y: isDragActive ? -5 : 0 }}
          className="space-y-4"
        >
          <div className="w-16 h-16 mx-auto bg-mint-100 rounded-full flex items-center justify-center">
            {isDragActive ? (
              <Upload className="w-8 h-8 text-mint-600" />
            ) : (
              <Camera className="w-8 h-8 text-mint-600" />
            )}
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-800">
              {isDragActive ? 'Drop your receipt here' : 'Upload Receipt'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Drag & drop or click to select a receipt image
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Supports JPG, PNG, GIF, WebP (max 10MB)
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );

  const renderProcessingStep = () => (
    <motion.div variants={fadeIn} className="text-center space-y-6">
      <div className="w-20 h-20 mx-auto">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-full h-full border-4 border-mint-200 border-t-mint-600 rounded-full"
        />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-800">Processing Receipt</h3>
        <p className="text-sm text-gray-500 mt-1">
          Extracting text and amounts from your receipt...
        </p>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <motion.div
          className="bg-mint-600 h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <p className="text-xs text-gray-500">{progress}% complete</p>
      {uploadedImage && (
        <img
          src={uploadedImage}
          alt="Uploaded receipt"
          className="max-w-32 max-h-32 mx-auto rounded-lg shadow-md"
        />
      )}
    </motion.div>
  );

  const renderReviewStep = () => (
    <motion.div variants={fadeIn} className="space-y-6">
      <div className="text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
        <h3 className="text-lg font-semibold text-gray-800">Review & Confirm</h3>
        <p className="text-sm text-gray-500">Please verify the extracted information</p>
      </div>

      {uploadedImage && (
        <div className="flex justify-center">
          <img
            src={uploadedImage}
            alt="Receipt"
            className="max-w-40 max-h-40 rounded-lg shadow-md"
          />
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
          <input
            type="number"
            step="0.01"
            value={editingData?.amount || ''}
            onChange={(e) => handleEdit('amount', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Merchant</label>
          <input
            type="text"
            value={editingData?.merchant || ''}
            onChange={(e) => handleEdit('merchant', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={editingData?.category || 'other'}
            onChange={(e) => handleEdit('category', e.target.value as CategoryType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-500"
          >
            <optgroup label="✅ Core Categories">
              {CoreCategories.map((key) => (
                <option key={key} value={key}>
                  {CategoryLabels[key]}
                </option>
              ))}
            </optgroup>
            <optgroup label="💡 Quick Add Suggestions">
              {QuickAddCategories.map((key) => (
                <option key={key} value={key}>
                  {CategoryLabels[key]}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input
            type="text"
            value={editingData?.description || ''}
            onChange={(e) => handleEdit('description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={editingData?.date ? editingData.date.toISOString().split('T')[0] : ''}
            onChange={(e) => handleEdit('date', new Date(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mint-500"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setStep('upload')}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Start Over
        </button>
        <button
          onClick={handleConfirm}
          className="flex-1 px-4 py-2 bg-mint-600 text-white rounded-lg hover:bg-mint-700"
        >
          Add Transaction
        </button>
      </div>
    </motion.div>
  );

  const renderSuccessStep = () => (
    <motion.div variants={scaleIn} className="text-center space-y-4">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
      </motion.div>
      <h3 className="text-lg font-semibold text-gray-800">Transaction Added!</h3>
      <p className="text-sm text-gray-500">Your receipt has been processed and saved.</p>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        variants={scaleIn}
        initial="initial"
        animate="animate"
        exit="exit"
        className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Scan Receipt</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {step === 'upload' && renderUploadStep()}
          {step === 'processing' && renderProcessingStep()}
          {step === 'review' && renderReviewStep()}
          {step === 'success' && renderSuccessStep()}
        </AnimatePresence>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2"
          >
            <AlertCircle size={16} />
            <span className="text-sm">{error}</span>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ReceiptUploader;