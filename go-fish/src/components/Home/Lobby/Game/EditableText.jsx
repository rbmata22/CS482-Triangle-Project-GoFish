import { useState } from 'react';

const EditableText = ({ text, isEditing: canEdit, onSave, className }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(text);

  const handleSave = () => {
    if (editValue.trim() !== text) {
      onSave(editValue);
    }
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div 
        className={`${className} editable-text`}
        onClick={() => canEdit && setIsEditing(true)}
      >
        {text}
      </div>
    );
  }

  return (
    <input
      type="text"
      className={`${className} editable-input`}
      value={editValue}
      onChange={(e) => setEditValue(e.target.value)}
      onBlur={handleSave}
      onKeyPress={(e) => e.key === 'Enter' && handleSave()}
      autoFocus
    />
  );
};

export default EditableText;