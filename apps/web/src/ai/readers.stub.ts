// Used by the single-file build (no account, no AI): the PDF/Word readers are left out to keep the file small.
export default {};
export const getDocument = () => {
  throw new Error('PDF reading is not available in this build');
};
export const GlobalWorkerOptions = {};
