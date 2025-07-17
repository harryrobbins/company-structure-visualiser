// frontend/static/js/components.js

// A simple loading spinner component
export const LoadingSpinner = {
  template: `
    <div class="flex items-center justify-center p-4">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  `
};

// A generic modal component for pop-up forms and dialogs
export const ModalComponent = {
  props: ['title'],
  template: `
    <transition name="modal-fade">
      <!-- FIX: Removed the @click.self event to prevent closing the modal when clicking the background overlay. -->
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
          <div class="p-4 border-b flex justify-between items-center">
            <h3 class="text-xl font-semibold">{{ title }}</h3>
            <button @click="$emit('close')" class="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
          </div>
          <div class="p-4 overflow-y-auto">
            <slot></slot>
          </div>
        </div>
      </div>
    </transition>
  `
};
