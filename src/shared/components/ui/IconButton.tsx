export function IconButton({ icon, onClick, active, 'aria-label': ariaLabel }: any) {
  return (
    <button 
      className={`icon-button ${active ? 'is-active' : ''}`} 
      onClick={onClick} 
      aria-label={ariaLabel}
      type="button"
    >
      {icon}
    </button>
  );
}
