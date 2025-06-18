<template>
  <div v-if="a && (b || c)">
    <div v-if="d">
      <div v-if="e">
        <div v-if="f">
          <div v-if="g">
            <div v-if="h">
              <div v-if="i">
                Deep
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']
};
</script>
