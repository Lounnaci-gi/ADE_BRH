// Centralized SweetAlert2 helper with ADE BRH theme
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

// Themed mixin
export const swal = Swal.mixin({
  customClass: {
    popup: 'rounded-2xl shadow-2xl border border-water-200/60 dark:border-water-700/60',
    title: 'text-water-800 dark:text-water-100 font-semibold',
    htmlContainer: 'text-water-600 dark:text-water-300',
    confirmButton: 'swal-confirm-btn inline-flex items-center justify-center px-4 py-2 rounded-xl bg-water-600 hover:bg-water-700 text-white font-semibold shadow-md',
    cancelButton: 'swal-cancel-btn inline-flex items-center justify-center px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-water-700 dark:hover:bg-water-600 text-water-700 dark:text-white font-semibold',
    denyButton: 'swal-deny-btn inline-flex items-center justify-center px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold',
  },
  buttonsStyling: false,
  showClass: {
    popup: 'animate__animated animate__fadeInDown'
  },
  hideClass: {
    popup: 'animate__animated animate__fadeOutUp'
  }
});

export const swalConfirmDelete = async ({ title = 'Confirmer la suppression', text = 'Cette action est irréversible.', confirmText = 'Oui, supprimer', cancelText = 'Annuler' } = {}) => {
  return await swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true
  });
};

export const swalConfirm = async ({ title = 'Êtes-vous sûr ?', text = '', confirmText = 'Confirmer', cancelText = 'Annuler', icon = 'question' } = {}) => {
  return await swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true
  });
};

export const swalSuccess = async (text = 'Opération effectuée avec succès', title = 'Succès') => {
  return await swal.fire({ icon: 'success', title, text });
};

export const swalError = async (text = 'Une erreur est survenue', title = 'Erreur') => {
  return await swal.fire({ icon: 'error', title, text });
};

export const swalToast = (icon = 'success') => {
  return swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    iconColor: icon === 'success' ? '#16a34a' : icon === 'error' ? '#dc2626' : '#0ea5e9',
  });
};

export default swal;


