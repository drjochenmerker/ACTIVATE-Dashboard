<template>
  <p v-if="foo ? bar : baz">Hello</p>
</template>

<script>
export default {
  props: ['foo', 'bar', 'baz']
}
</script>
