function DeleteModal({ cafe, onConfirm, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal delete-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-body">
          <div className="delete-icon">🗑️</div>
          <h3>Supprimer ce café ?</h3>
          <p>
            Vous allez supprimer <strong>{cafe.name}</strong>.<br />
            Cette action est irréversible.
          </p>
          <div className="delete-actions">
            <button className="btn-cancel" onClick={onClose}>
              Annuler
            </button>
            <button className="btn-confirm-delete" onClick={onConfirm}>
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeleteModal
