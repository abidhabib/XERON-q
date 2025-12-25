// Add inside MonthlySalary.jsx or as separate component
const UploadField = ({ label, accept, onChange, required }) => {
  const [preview, setPreview] = useState('');

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      onChange(file);
      const url = URL.createObjectURL(file);
      setPreview(url);
    }
  };

  return (
    <div>
      <label className="text-[#D4AF37]/70 text-xs block mb-1.5">{label}</label>
      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-[#1c2a3a] rounded-xl cursor-pointer bg-[#1c2a3a] hover:bg-[#202c3b] transition-colors">
        {preview ? (
          <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
        ) : (
          <span className="text-[#D4AF37]/50 text-sm">Tap to upload</span>
        )}
        <input
          type="file"
          accept={accept}
          onChange={handleFile}
          className="hidden"
          required={required}
        />
      </label>
    </div>
  );
};
export default UploadField;