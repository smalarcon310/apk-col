export const getAssetPath = (assetName) => {
  const isFileProtocol = window.location.protocol === 'file:';
  const safeName = encodeURI(assetName);
  return isFileProtocol ? `./${safeName}` : `/${safeName}`;
};

export default getAssetPath;
