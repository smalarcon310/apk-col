export const auth = {
  get currentUser() {
    try {
      const user = JSON.parse(localStorage.getItem('sessionUser') || 'null');
      return user ? { uid: user.id, email: user.email, displayName: user.name, ...user } : null;
    } catch { return null; }
  },
  onAuthStateChanged(callback) {
    callback(this.currentUser);
    return () => {};
  },
};
export const onAuthStateChanged = (instance, callback) => instance.onAuthStateChanged(callback);
