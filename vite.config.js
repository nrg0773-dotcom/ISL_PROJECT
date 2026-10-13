import { readFileSync } from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { viteSingleFile } from 'vite-plugin-singlefile'

const modelModuleId = 'virtual:embedded-model-urls'
const resolvedModelModuleId = `\0${modelModuleId}`
const mimeTypes = {
  '.bin': 'application/octet-stream',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
}

function embeddedModelUrlsPlugin(standalone) {
  return {
    name: 'embedded-model-urls',
    resolveId(id) {
      return id === modelModuleId ? resolvedModelModuleId : null
    },
    load(id) {
      if (id !== resolvedModelModuleId) return null

      const models = [
        {
          exportName: 'bookshelfSceneUrl',
          directory: 'handpainted-watercolor-scene',
        },
        {
          exportName: 'submergedSceneUrl',
          directory: 'book-five-submerged',
        },
      ]
      const publicModelsDir = path.resolve('public/models')

      if (!standalone) {
        return models
          .map(
            ({ exportName, directory }) =>
              `export const ${exportName} = "/models/${directory}/scene.gltf"`,
          )
          .join('\n')
      }

      const embeddedModels = models.map(({ exportName, directory }) => {
        const modelDirectory = path.join(publicModelsDir, directory)
        const modelPath = path.join(modelDirectory, 'scene.gltf')
        const model = JSON.parse(readFileSync(modelPath, 'utf8'))

        for (const resource of [...(model.buffers ?? []), ...(model.images ?? [])]) {
          if (!resource.uri || resource.uri.startsWith('data:')) continue

          const resourcePath = path.resolve(modelDirectory, resource.uri)
          if (!resourcePath.startsWith(`${modelDirectory}${path.sep}`)) {
            throw new Error(`Model resource escapes its directory: ${resource.uri}`)
          }

          const mimeType = mimeTypes[path.extname(resourcePath).toLowerCase()]
          if (!mimeType) {
            throw new Error(`Unsupported embedded model resource: ${resource.uri}`)
          }

          const data = readFileSync(resourcePath).toString('base64')
          resource.uri = `data:${mimeType};base64,${data}`
        }

        return `export const ${exportName} = URL.createObjectURL(new Blob([JSON.stringify(${JSON.stringify(model)})], { type: 'model/gltf+json' }))`
      })

      return embeddedModels.join('\n')
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const standalone = mode === 'standalone'

  return {
    plugins: [
      react(),
      tailwindcss(),
      embeddedModelUrlsPlugin(standalone),
      ...(standalone ? [viteSingleFile()] : []),
    ],
    define: {
      __STANDALONE__: JSON.stringify(standalone),
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    ...(standalone && {
      base: './',
      build: {
        outDir: 'dist-standalone',
        copyPublicDir: false,
      },
    }),
  }
})
