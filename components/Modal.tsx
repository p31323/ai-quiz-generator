
import React from 'react';
import { ModalState } from '../types';

interface ModalProps {
  modalState: ModalState;
  closeModal: () => void;
}

const Modal: React.FC<ModalProps> = ({ modalState, closeModal }) => {
  if (!modalState.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#2d3748] rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-2xl font-bold mb-4 text-blue-400">{modalState.title}</h3>
        <div 
          className="max-h-[60vh] overflow-y-auto pr-2 text-gray-700 dark:text-gray-300"
          dangerouslySetInnerHTML={{ __html: modalState.content }}
        ></div>
        <div className="flex justify-end mt-6 space-x-4">
          {modalState.isConfirm ? (
            <>
              <button
                onClick={modalState.onCancel}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition"
              >
                取消 / Cancel
              </button>
              <button
                onClick={modalState.onConfirm}
                className="bg-[#3d84c6] hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition"
              >
                確定 / Confirm
              </button>
            </>
          ) : (
            <button
              onClick={closeModal}
              className="bg-[#3d84c6] hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition"
            >
              關閉 / Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;