const handleImageUpload = async (
  event: React.ChangeEvent<HTMLInputElement>,
  type: 'heroBackground' | 'pageBackground'
) => {
  if (!event.target.files?.length) return;

  const file = event.target.files[0];
  
  setUploading((prev) => ({
    ...prev,
    [type]: true,
  }));

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    // Use absolute URL with base URL for API calls
    const baseUrl = window.location.origin;
    const response = await fetch(`${baseUrl}/api/admin/homepage`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Hiba a feltöltés során');
    }

    const data = await response.json();
    setSettings(data.settings);
    toast.success(`${type === 'heroBackground' ? 'Hero háttér' : 'Oldal háttér'} kép sikeresen feltöltve!`);
  } catch (error) {
    console.error('Error uploading image:', error);
    toast.error('Hiba történt a kép feltöltése során.');
  } finally {
    setUploading((prev) => ({
      ...prev,
      [type]: false,
    }));
  }
};

const saveContent = async () => {
  setSaving(true);
  try {
    const baseUrl = window.location.origin;
    const response = await fetch(`${baseUrl}/api/admin/homepage/content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      throw new Error('Hiba a mentés során');
    }

    toast.success('Tartalom sikeresen mentve!');
  } catch (error) {
    console.error('Error saving content:', error);
    toast.error('Hiba történt a tartalom mentése során.');
  } finally {
    setSaving(false);
  }
}; 