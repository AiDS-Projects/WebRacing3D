I need to flag a mismatch before doing anything, because the instructions I was given don't match the actual files.

**What the prompt claimed vs. what's actually here:**

1. The prompt said `src/index.ts` is 3 export lines. The real file is a 253-line self-contained THREE.js rendering app (`App`, `GameHud`, `createRenderer`, `createCamera`, `createLights`, entry bootstrap at `src/index.ts:245`). There is no generator, `base_stages`, validator, or cleanup code in it.

2. The four requested changes (cleanup, incremental routing, `development_failed` state, path-whitelist gate) are **generator/scaffolder behaviors**, not rendering-app code. They don't belong in `src/index.ts`.

3. Those behaviors are actually the `generator` config block in `package.json`, and they are **already fully implemented there**:

| 反思要求 | package.json 现有实现 |
|---|---|
| 前置 cleanup 删除错误目录 | `generator.cleanup`: `preGeneration:true`, `restoreEmptyBaseline:true`, `removeDirectories:[src/camera,src/physics,src/player,src/race]` (`package.json:36-45`) |
| 缺失骨架标志文件走全量骨架生成 | `generator.routing`: `skeletonMarkerFiles`, `onMissingMarkerFile:"full_skeleton_regeneration"`, `forbidDiffOnSemanticMismatch:true` (`package.json:46-54`) |
| `development_failed` 接活（files 空/非法→重试） | `generator.base_stages.development_failed`: `filesEmptyOrInvalid:true`, `onFilesInvalid:"retry"` (`package.json:83-93`) |
| 校验器路径白名单硬门禁 | `generator.validator`: `pathWhitelistHardGate:true`, `onNonWhitelistPath:"fail"` (`package.json:114-127`) |

Note: the prompt says "五个错误目录" but lists only four (`camera/physics/player/race`); the config lists the same four.

**So I did not modify `src/index.ts`.** Adding generator/validator logic into a THREE.js entry file would violate the requirement to preserve existing functionality and not add unrequested content — none of the requested logic can be "叠加" onto that file without rewriting it into something it isn't.

Also note the actual tree still contains `src/camera/FollowCamera.ts`, `src/player/PlayerCar.ts`, `src/race/LapTracker.ts` — the "wrong" business directories the config is designed to purge on next full regeneration (there is no `src/physics/`).

How would you like me to proceed? Options:

- **(A)** Treat `package.json`'s `generator` block as the source of truth and leave `src/index.ts` untouched (it's already consistent with the reflection requirements).
- **(B)** Actually perform the cleanup the reflection describes — delete `src/camera/`, `src/player/`, `src/race/` (and any `src/physics/` if present) to restore the empty skeleton baseline, and regenerate the skeleton.
- **(C)** You point me to the real generator source file (not `src/index.ts`), and I make the four changes there.

Which do you want?