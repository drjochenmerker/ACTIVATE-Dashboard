<script setup>
// === Props (tooManyProps) ===
defineProps({
  prop1: String,
  prop2: Number,
  prop3: Boolean,
  prop4: Object,
  prop5: Array
})

// === Cyclomatic Complexity + deepIndentation (via control nesting) ===
function init() {
  if (condition) {
    for (let i = 0; i < 10; i++) {
      while (anotherCondition) {
        if (nested) {
          if (nested2) {
            if (nested3) {
              // very deep nesting for testing
            }
          }
        }
      }
    }
  }
}

// === Complicated Conditions (script) ===
if (isGauranga && !isDisabled && hasPermission && (isAdmin || isModerator) && checkCondition(x, y)) {
  doSomething()
}

// === Script Length filler ===
for (let i = 0; i < 150; i++) {
  console.log(i)
}
</script>

<template>
  <!-- Complicated Conditions (template) + deepIndentation (template nesting) -->
  <div>
    <div>
      <div>
        <div>
          <div v-if="(isGauranga && !isDisabled && hasPermission && isModerator) || checkCondition(x, y)">
            {{ message }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
