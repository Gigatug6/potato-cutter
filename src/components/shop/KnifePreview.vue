<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { AmbientLight, DirectionalLight, PerspectiveCamera, Scene, WebGLRenderer, type Texture } from 'three'
import { buildKnife, type KnifeObject } from '../../engine/knives/buildKnife'
import { createEnvironment } from '../../engine/scene/env'
import type { KnifeDef } from '../../game/data/knives'

const props = defineProps<{ knife: KnifeDef }>()
const host = ref<HTMLDivElement>()
let renderer: WebGLRenderer | null = null
let env: Texture | null = null
let current: KnifeObject | null = null
const scene = new Scene()
const camera = new PerspectiveCamera(32, 2, 0.1, 50)
let raf = 0

function setKnife(def: KnifeDef) {
  if (current) { scene.remove(current.group); current.dispose() }
  current = buildKnife(def)
  current.group.position.z = -0.35 // centre visuel
  scene.add(current.group)
}

onMounted(() => {
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true })
  } catch { return }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  host.value!.appendChild(renderer.domElement)
  renderer.domElement.style.width = '100%'
  renderer.domElement.style.height = '100%'
  env = createEnvironment(renderer)
  scene.environment = env
  scene.add(new AmbientLight('#ffffff', 1.2))
  const sun = new DirectionalLight('#ffffff', 2.2)
  sun.position.set(3, 4, 2)
  scene.add(sun)
  camera.position.set(0, 0.9, 4.4)
  camera.lookAt(0, 0.3, 0)
  setKnife(props.knife)
  const t0 = performance.now()
  const loop = () => {
    const t = (performance.now() - t0) / 1000
    const el = host.value
    if (el && renderer) {
      const w = el.clientWidth, h = el.clientHeight
      if (renderer.domElement.width !== Math.floor(w * renderer.getPixelRatio()) || renderer.domElement.height !== Math.floor(h * renderer.getPixelRatio())) {
        renderer.setSize(w, h, false)
        camera.aspect = w / Math.max(1, h)
        camera.updateProjectionMatrix()
      }
    }
    if (current) {
      current.group.rotation.y = t * 0.9
      current.update(t)
    }
    renderer?.render(scene, camera)
    raf = requestAnimationFrame(loop)
  }
  loop()
})

watch(() => props.knife, setKnife)

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  current?.dispose()
  env?.dispose()
  renderer?.dispose()
  renderer?.domElement.remove()
})
</script>

<template>
  <div ref="host" class="preview" data-testid="knife-preview" :aria-label="`Aperçu de ${knife.name}`"></div>
</template>

<style scoped>
.preview { height: 190px; border-radius: 14px; background: radial-gradient(circle at 50% 40%, #fff6e0, #e7d2a8); margin-bottom: 10px; }
</style>
