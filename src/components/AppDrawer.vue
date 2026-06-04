<template>
  <Teleport :to="teleportTo">
    <div :class="rootClass">
      <Transition name="app-drawer-fade">
        <div v-if="modelValue" class="app-drawer__overlay" :style="overlayStyle" @click="handleOverlayClick" />
      </Transition>

      <Transition :name="transitionName">
        <aside v-if="modelValue" :id="panelId" ref="panelRef" role="dialog" aria-modal="true" :aria-label="ariaLabel"
          tabindex="-1" class="app-drawer__panel" :class="[sideClass, panelClass]" :style="panelStyle">
          <div v-if="$slots.header" class="app-drawer__header">
            <slot name="header" :close="closeDrawer" />
          </div>

          <div class="app-drawer__body" :class="hasChrome ? 'app-drawer__body--scroll' : bodyClass">
            <slot :close="closeDrawer" />
          </div>

          <div v-if="$slots.footer" class="app-drawer__footer">
            <slot name="footer" :close="closeDrawer" />
          </div>
        </aside>
      </Transition>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useSlots, watch } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    panelId?: string;
    ariaLabel?: string;
    side?: "left" | "right" | "bottom" | "top";
    mobileOnly?: boolean;
    closeOnOverlay?: boolean;
    closeOnEsc?: boolean;
    lockScroll?: boolean;
    teleportTo?: string;
    panelClass?: string;
    bodyClass?: string;
    offset?: string | number;
    panelZIndex?: number;
  }>(),
  {
    panelId: undefined,
    ariaLabel: "Drawer panel",
    side: "bottom",
    mobileOnly: false,
    closeOnOverlay: true,
    closeOnEsc: true,
    lockScroll: true,
    teleportTo: "body",
    panelClass: "",
    bodyClass: "",
    offset: 0,
    panelZIndex: 100,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const slots = useSlots();
const panelRef = ref<HTMLElement | null>(null);
const lastFocusedElement = ref<HTMLElement | null>(null);
const previousBodyOverflow = ref("");
const isBodyScrollLocked = ref(false);

const hasChrome = computed(() => Boolean(slots.header || slots.footer));
const rootClass = computed(() =>
  props.mobileOnly ? "app-drawer-root app-drawer-root--mobile" : "app-drawer-root",
);

const sideClass = computed(() => `app-drawer__panel--${props.side}`);
const transitionName = computed(() => `app-drawer-${props.side}`);

const panelStyle = computed(() => {
  const style: Record<string, string | number> = {
    zIndex: props.panelZIndex,
  };
  const offset = normalizeOffset(props.offset);

  if (offset && props.side === "bottom") {
    style.bottom = offset;
  }
  if (offset && props.side === "top") {
    style.top = offset;
  }

  return style;
});

const overlayStyle = computed(() => {
  const style: Record<string, string | number> = {
    zIndex: Math.max(0, props.panelZIndex - 10),
  };
  const offset = normalizeOffset(props.offset);

  if (offset && props.side === "bottom") {
    style.bottom = offset;
  }
  if (offset && props.side === "top") {
    style.top = offset;
  }

  return style;
});

function normalizeOffset(value: string | number) {
  if (value === 0 || value === "0" || value == null) {
    return "";
  }

  return typeof value === "number" ? `${value}px` : value;
}

function closeDrawer() {
  emit("update:modelValue", false);
}

function handleOverlayClick() {
  if (props.closeOnOverlay) {
    closeDrawer();
  }
}

function lockBodyScroll() {
  if (!props.lockScroll || isBodyScrollLocked.value) {
    return;
  }

  previousBodyOverflow.value = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  isBodyScrollLocked.value = true;
}

function unlockBodyScroll() {
  if (!isBodyScrollLocked.value) {
    return;
  }

  document.body.style.overflow = previousBodyOverflow.value;
  isBodyScrollLocked.value = false;
}

function onKeyDown(event: KeyboardEvent) {
  if (!props.modelValue || !props.closeOnEsc || event.key !== "Escape") {
    return;
  }

  event.preventDefault();
  closeDrawer();
}

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (typeof document === "undefined") {
      return;
    }

    if (isOpen) {
      const activeElement = document.activeElement;
      lastFocusedElement.value =
        activeElement instanceof HTMLElement ? activeElement : null;
      lockBodyScroll();
      await nextTick();
      panelRef.value?.focus();
      return;
    }

    unlockBodyScroll();
    lastFocusedElement.value?.focus({ preventScroll: true });
    lastFocusedElement.value = null;
  },
  { immediate: true },
);

if (typeof window !== "undefined") {
  window.addEventListener("keydown", onKeyDown);
}

onBeforeUnmount(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("keydown", onKeyDown);
  }
  unlockBodyScroll();
});
</script>

<style scoped>
.app-drawer-root {
  position: relative;
}

.app-drawer-root--mobile {
  display: block;
}

.app-drawer__overlay {
  position: fixed;
  inset: 0;
  background: rgba(3, 7, 18, 0.58);
  backdrop-filter: blur(2px);
}

.app-drawer__panel {
  position: fixed;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--ui-border);
  color: var(--ui-text);
  background: var(--ui-surface-panel);
  box-shadow: 0 -24px 70px rgba(0, 0, 0, 0.46);
}

.app-drawer__panel:focus {
  outline: none;
}

.app-drawer__panel--bottom {
  right: 0;
  bottom: 0;
  left: 0;
  max-height: min(82vh, 620px);
  border-radius: 18px 18px 0 0;
}

.app-drawer__panel--top {
  top: 0;
  right: 0;
  left: 0;
  max-height: min(82vh, 620px);
  border-radius: 0 0 18px 18px;
}

.app-drawer__panel--left,
.app-drawer__panel--right {
  top: 0;
  bottom: 0;
  width: min(360px, calc(100vw - 20px));
}

.app-drawer__panel--left {
  left: 0;
  border-radius: 0 18px 18px 0;
}

.app-drawer__panel--right {
  right: 0;
  border-radius: 18px 0 0 18px;
}

.app-drawer__header,
.app-drawer__footer {
  flex: 0 0 auto;
}

.app-drawer__body {
  min-height: 0;
}

.app-drawer__body--scroll {
  flex: 1 1 auto;
  overflow-y: auto;
}

.app-drawer-fade-enter-active,
.app-drawer-fade-leave-active,
.app-drawer-bottom-enter-active,
.app-drawer-bottom-leave-active,
.app-drawer-top-enter-active,
.app-drawer-top-leave-active,
.app-drawer-left-enter-active,
.app-drawer-left-leave-active,
.app-drawer-right-enter-active,
.app-drawer-right-leave-active {
  transition:
    opacity 180ms ease,
    transform 240ms cubic-bezier(0.22, 0.61, 0.36, 1);
}

.app-drawer-fade-enter-from,
.app-drawer-fade-leave-to {
  opacity: 0;
}

.app-drawer-bottom-enter-from,
.app-drawer-bottom-leave-to {
  transform: translateY(100%);
}

.app-drawer-top-enter-from,
.app-drawer-top-leave-to {
  transform: translateY(-100%);
}

.app-drawer-left-enter-from,
.app-drawer-left-leave-to {
  transform: translateX(-100%);
}

.app-drawer-right-enter-from,
.app-drawer-right-leave-to {
  transform: translateX(100%);
}
</style>
