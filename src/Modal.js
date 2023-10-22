import "./Modal.css";

function Modal({ children, show, onExit, width = 400, height = 250 }) {
	return (
		<div className={`modal ${show ? "modalShow" : ""}`} onClick={() => onExit?.()}>
			<div className="modalContent" style={{ width, height }} onClick={(e) => e.stopPropagation()}>
				{children}
			</div>
		</div>
	);
}

export default Modal;
