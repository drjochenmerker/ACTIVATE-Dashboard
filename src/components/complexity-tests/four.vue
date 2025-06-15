<template>
  <p v-show="foo && bar">Hello</p>
</template>

<script>
export default {
  props: ['foo', 'bar']
}
</script>
