<template>
  <Teleport :to="teleportTo">
    <div :class="rootClass">
      <Transition name="app-drawer-fade">
        <div
          v-if="modelValue"
          class="app-drawer__overlay"
          :style="overlayStyle"
          @click="handleOverlayClick"
        />
      </Transition>

      <Transition :name="transitionName">
        <aside
          v-if="modelValue"
          :id="panelId"
          ref="panelRef"
          role="dialog"
          aria-modal="true"
          :aria-label="ariaLabel"
          tabindex="-1"
          class="app-drawer__panel"
          :class="[sideClass, panelClass]"
          :style="panelStyle"
        >
          <div v-if="$slots.header" class="app-drawer__header">
            <slot name="header" :close="closeDrawer" />
          </div>

          <div
            class="app-drawer__body"
            :class="hasChrome ? 'app-drawer__body--scroll' : bodyClass"
          >
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
