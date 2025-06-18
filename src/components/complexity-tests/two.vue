<template>
  <p v-if="a">A</p>
  <p v-else-if="b">B</p>
  <p v-else>C</p>
</template>

<script>
export default {
  props: ['a', 'b']
}
</script>
