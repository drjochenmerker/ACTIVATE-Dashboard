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
  methods: {
    complexFunction(x, y) {
      if (x > 10) {
        if (y < 5) {
          return 'A';
        } else if (y < 8) {
          return 'B';
        } else {
          return 'C';
        }
      } else if (x > 5) {
        switch (y) {
          case 1:
            return 'D';
          case 2:
            return 'E';
          default:
            return 'F';
        }
      } else {
        try {
          const res = x / y;
          return res > 0 ? 'G' : 'H';
        } catch (e) {
          return 'error';
        }
      }
    }
  }
}
</script>
