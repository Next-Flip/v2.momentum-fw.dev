import { onMounted, ref, type Ref } from "vue";

export function useMounted(): Readonly<Ref<boolean>> {
    const isMounted = ref(false);
    onMounted(() => {
        isMounted.value = true;
    });
    return isMounted;
}
