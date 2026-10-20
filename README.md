# SDK7 Template scene

## Try it out

**With the Creator Hub (recommended)**

1. Download this repository.

2. Install the [Creator Hub](https://decentraland.org/download/creator-hub), the official desktop app for creating, previewing, and publishing Decentraland scenes.

3. In the **Scenes** tab, import this scene's root folder.

4. Press **Preview** to explore the scene in Decentraland.

**With the command line**

Inside this scene's root directory run:

```
npm install
npm run start
```

**With an AI coding assistant**

If you build with an AI coding assistant (Claude Code, Cursor, GitHub Copilot, and others), install the official Decentraland SDK Skills first. They teach your agent verified SDK7 patterns for every topic: scene creation, 3D models, interactivity, UI, multiplayer, deployment, and more.

```
npx skills add decentraland/sdk-skills
```

See [Vibe Coding with AI](https://docs.decentraland.org/creator/scenes-sdk7/getting-started/vibe-coding) for the full guide.

## What's new on SDK 7

Below are some basic concepts about the SDK 7 syntax. For more details, see the [Documentation site](https://docs.decentraland.org/creator/).

### Entities

An Entity is just an ID. It is an abstract concept not represented by any data structure. There is no "class Entity". Just a number that is used as a reference to group different components.

```ts
const myEntity = engine.addEntity()
console.console.log(myEntity) // 100

// Remove Entity
engine.removeEntity(myEntity)
```

> Note: Note that it's no longer necessary to separately create an entity and then add it to the engine, this is all done in a single act.

### Components

The component is just a data container, WITHOUT any functions.

To add a component to an entity, the entry point is now the component type, not the entity.

```ts
Transform.create(myEntity, <params>)
```

This is different from how the syntax was in SDK6:

```ts
// OLD Syntax
myEntity.addComponent(Transform)
```

#### Base Components

Base components already come packed as part of the SDK. Most of them interact directly with the renderer in some way. This is the full list of currently supported base components:

- Transform
- Animator
- Material
- MeshRenderer
- MeshCollider
- AudioSource
- AudioStream
- AvatarAttach
- AvatarModifierArea
- AvatarShape
- Billboard
- CameraMode
- CameraModeArea
- GltfContainer
- NftShape
- PointerEventsResult
- PointerHoverFeedback
- PointerLock
- Raycast
- RaycastResult
- TextShape
- VisibilityComponent

```ts
const entity = engine.addEntity()
Transfrom.create(entity, {
  position: Vector3.create(12, 1, 12)
  scale: Vector3.One(),
  rotation: Quaternion.Identity()
})
GltfContainer.create(zombie, {
  withCollisions: true,
  isPointerBlocker: true,
  visible: true,
  src: 'models/zombie.glb'
})
```

#### Custom Components

Each component must have a unique number ID. If a number is repeated, the engine or another player receiving updates might apply changes to the wrong component. Note that numbers 1-2000 are reserved for the base components.

When creating a custom component you declare the schema of the data to be stored in it. Every field in a component MUST belong to one of the built-in special schemas provided as part of the SDK. These special schemas include extra functionality that allows them to be serialized/deserialized.

Currently, the names of these special schemas are:

##### Primitives

1. `Schemas.Boolean`: true or false (serialized as a Byte)
2. `Schemas.String`: UTF8 strings (serialized length and content)
3. `Schemas.Float`: single precission float
4. `Schemas.Double`: double precision float
5. `Schemas.Byte`: a single byte, integer with range 0..255
6. `Schemas.Short`: 16 bits signed-integer with range -32768..32767
7. `Schemas.Int`: 32 bits signed-integer with range -2³¹..(2³¹-1)
8. `Schemas.Int64`: 64 bits signed-integer
9. `Schemas.Number`: an alias to Schemas.Float

##### Specials

10. `Schemas.Entity`: a wrapper to int32 that casts the type to `Entity`
11. `Schemas.Vector3`: a Vector3 with { x, y, z }
12. `Schemas.Quaternion`: a Quaternion with { x, y, z, w}
13. `Schemas.Color3`: a Color3 with { r, g, b }
14. `Schemas.Color4`: a Colo4 with { r, g, b, a }

##### Schema generator

15. `Schemas.Enum`: passing the serialization Schema and the original Enum as generic
16. `Schemas.Array`: passing the item Schema
17. `Schemas.Map`: passing a Map with Schemas as values
18. `Schemas.Optional`: passing the schema to serialize

Below are some examples of how these schemas can be declared.

```ts
const object = Schemas.Map({ x: Schemas.Int }) // { x: 1 }

const array = Schemas.Map(Schemas.Int) // [1,2,3,4]

const objectArray = Schemas.Array(Schemas.Map({ x: Schemas.Int })) // [{ x: 1 }, { x: 2 }]

const BasicSchemas = Schemas.Map({
  x: Schemas.Int,
  y: Schemas.Float,
  text: Schemas.String,
  flag: Schemas.Boolean
}) // { x: 1, y: 1.412, text: 'ecs 7 text', flag: true }

const VelocitySchema = Schemas.Map({
  x: Schemas.Float,
  y: Schemas.Float,
  z: Schemas.Float
})
```

To then create a custom component using one of these schemas, use the following syntax:

```ts
export const myCustomComponent = engine.defineComponent(MyDataSchema, ComponentID)
```

For contrast, below is an example of how components were constructed prior to SDK 7.

```ts
/**
 * OLD SDK
 */

// Define Component
@Component('velocity')
export class Velocity extends Vector3 {
  constructor(x: number, y: number, z: number) {
    super(x, y, z)
  }
}
// Create entity
const wheel = new Entity()

// Create instance of component with default values
wheel.addComponent(new WheelSpin())

/**
 * ECS 7
 */
// Define Component
const VelocitySchema = Schemas.Map({
  x: Schemas.Float,
  y: Schemas.Float,
  z: Schemas.Float
})
const COMPONENT_ID = 2008
const VelocityComponent = engine.defineComponent(Velocity, COMPONENT_ID)
// Create Entity
const entity = engine.addEntity()

// Create instance of component
VelocityComponent.create(entity, { x: 1, y: 2.3, z: 8 })

// Remove instance of a component
VelocityComponent.deleteFrom(entity)
```

### Systems

Systems are pure & simple functions.
All your logic comes here.
A system might hold data which is relevant to the system itself, but no data about the entities it processes.

To add a system, all you need to do is define a function and add it to the engine. The function may optionally include a `dt` parameter with the delay since last frame, just like in prior versions of the SDK.

```ts
// Basic system
function mySystem() {
  console.log('my system is running')
}

engine.addSystem(mySystem)

// System with dt
function mySystemDT(dt: number) {
  console.log('time since last frame:  ', dt)
}

engine.addSystem(mySystemDT)
```

#### Query components

The way to group/query the components inside systems is using the method getEntitiesWith.
`engine.getEntitiesWith(...components)`.

```ts
function physicsSystem(dt: number) {
  for (const [entity, transform, velocity] of engine.getEntitiesWith(Transform, Velocity)) {
    // transform & velocity are read only components.
    if (transform.position.x === 10) {
      // To update a component, you need to call the `.mutable` method
      const mutableVelocity = VelocityComponent.getMutable(entity)
      mutableVelocity.x += 1
    }
  }
}

// Add system to the engine
engine.addSystem(physicsSystem)

// Remove system
engine.removeSystem(physicsSystem)
```

### Mutability

Mutability is now an important distinction. We can choose to deal with mutable or with immutable versions of a component. We should use `getMutable` only when we plan to make changes to a component. Dealing with immutable versions of components results in a huge gain in performance.

The `.get()` function in a component returns an immutable version of the component. You can only read its values, but can't change any of the properties on it.

```ts
const immutableTransform = Transform.get(myEntity)
```

To fetch the mutable version of a component, call it via `ComponentDefinition.getMutable()`. For example:

```ts
const mutableTransform = Transform.getMutable(myEntity)
```

---

## Running Native Decentraland Bevy Explorer on Linux (Pop!_OS / Ubuntu 22.04 via Docker)

Running the native Decentraland Bevy Explorer directly on a Pop!_OS / Ubuntu 22.04 desktop requires overcoming three key system hurdles: GLIBC and library incompatibilities, display and audio passthrough inside Docker, and forcing the Vulkan graphics backend.

### Step 1: Diagnosing the System & Native Binary Compatibility

- **The Core Blocker**: Host machines on Pop!_OS 22.04 (Jammy) ship with GLIBC 2.35 and FFmpeg 4.4. The compiled native Decentraland Bevy binary from GitHub Actions is built against Ubuntu 24.04 (Noble), which strictly requires GLIBC 2.39 and FFmpeg 6 (`libavutil.so.58`).
- **Avoiding Host Breakage**: Attempting to upgrade GLIBC on 22.04 directly risks breaking core OS components. Instead, an official Ubuntu 24.04 Docker container isolates the environment, providing GLIBC 2.39 without touching host OS libraries.

### Step 2: Granting Hardware & Display Access to Docker

Configure host-to-container display and device bridging:

1. **Allow X11 Display Bridge**:
   ```bash
   xhost +local:docker
   ```

2. **Start the Container with Hardware Passthrough**:
   ```bash
   docker run --rm -it \
     --net=host \
     --ipc=host \
     --device /dev/dri \
     --device /dev/snd \
     --group-add audio \
     -e DISPLAY=$DISPLAY \
     -e XDG_RUNTIME_DIR=/tmp \
     -v /tmp/.X11-unix:/tmp/.X11-unix:rw \
     -v ~/dcl-native:/app \
     -w /app \
     ubuntu:24.04 bash
   ```

   **Flag breakdown**:
   - `--net=host`: Grants direct access to your local preview server running on `127.0.0.1:8000` (or `8001`).
   - `--device /dev/dri`: Gives direct hardware access to the physical GPU (e.g. Intel Iris Xe / Raptor Lake).
   - `--device /dev/snd & --group-add audio`: Passes physical ALSA sound devices to prevent the `LivekitAudioManager` panic.
   - `-v /tmp/.X11-unix:/tmp/.X11-unix:rw`: Mounts the X11 socket so the native window renders on your screen.
   - `-v ~/dcl-native:/app`: Mounts the downloaded Bevy Explorer files inside `/app`.

### Step 3: Installing Runtime Dependencies

Inside the container prompt (`root@pop-os:/app#`):

```bash
apt update && apt install -y --no-install-recommends \
  libavutil58 libavcodec60 libavformat60 libswscale7 libavdevice60 \
  libasound2t64 libvulkan1 mesa-vulkan-drivers vulkan-tools \
  libegl1 libgl1 libglx-mesa0 libnss3 libatk1.0-0 libatk-bridge2.0-0 \
  libcups2 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libpango-1.0-0 \
  libcairo2 libxkbcommon0 libxkbcommon-x11-0 alsa-utils
```

- **Keyboard Support**: `libxkbcommon-x11-0` fixes the `winit` event loop panic when initializing the X11 keyboard context.
- **Fast & Minimal**: `--no-install-recommends` skips unnecessary bloat (such as large voice/Sphinx models).

### Step 4: Configuring Permissions & Dynamic Linking

Set up the CEF (Chromium Embedded Framework) sandbox used by the React HUD:

```bash
chown root:root chrome-sandbox && chmod 4755 chrome-sandbox
```

### Step 5: Forcing the Native Vulkan Backend

Run the client with explicit Vulkan enforcement and dynamic library paths:

```bash
export XDG_RUNTIME_DIR=/tmp
WGPU_BACKEND=vulkan LD_LIBRARY_PATH=.:$LD_LIBRARY_PATH ./decentra-bevy --server http://127.0.0.1:8000
```

*(Replace port `8000` with `8001` if your dev server is running on that port).*

















































import bpy
import bmesh
import math
import random

# =============================================================================
# 0. CLEAN SCENE
# =============================================================================
def clean_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

# =============================================================================
# 1. MATERIALS MASTER
# =============================================================================
def build_master_materials():
    mats = {}

    # --- CHAIR MATERIALS ---
    m_chair_fab = bpy.data.materials.new(name="Chair_Fabric_Black")
    m_chair_fab.use_nodes = True
    b = m_chair_fab.node_tree.nodes.get("Principled BSDF")
    b.inputs['Base Color'].default_value = (0.02, 0.02, 0.025, 1.0)
    b.inputs['Roughness'].default_value = 0.82
    if 'Sheen Weight' in b.inputs:
        b.inputs['Sheen Weight'].default_value = 0.5
    elif 'Sheen' in b.inputs:
        b.inputs['Sheen'].default_value = 0.5
    mats['chair_fabric'] = m_chair_fab

    m_chair_wood = bpy.data.materials.new(name="Chair_Rosewood")
    m_chair_wood.use_nodes = True
    b = m_chair_wood.node_tree.nodes.get("Principled BSDF")
    b.inputs['Base Color'].default_value = (0.32, 0.14, 0.06, 1.0)
    b.inputs['Roughness'].default_value = 0.30
    mats['chair_wood'] = m_chair_wood

    # --- DESK MATERIALS ---
    m_desk_white = bpy.data.materials.new(name="Desk_White_SolidSurface")
    m_desk_white.use_nodes = True
    b = m_desk_white.node_tree.nodes.get("Principled BSDF")
    b.inputs['Base Color'].default_value = (0.92, 0.92, 0.93, 1.0)
    b.inputs['Roughness'].default_value = 0.22
    mats['desk_white'] = m_desk_white

    m_desk_grey = bpy.data.materials.new(name="Desk_Inset_Grey")
    m_desk_grey.use_nodes = True
    b = m_desk_grey.node_tree.nodes.get("Principled BSDF")
    b.inputs['Base Color'].default_value = (0.78, 0.79, 0.81, 1.0)
    b.inputs['Roughness'].default_value = 0.35
    mats['desk_grey'] = m_desk_grey

    m_desk_black = bpy.data.materials.new(name="Desk_Plinth_Black")
    m_desk_black.use_nodes = True
    b = m_desk_black.node_tree.nodes.get("Principled BSDF")
    b.inputs['Base Color'].default_value = (0.04, 0.04, 0.045, 1.0)
    b.inputs['Roughness'].default_value = 0.60
    mats['desk_black'] = m_desk_black

    m_desk_led = bpy.data.materials.new(name="Desk_LED_WarmWhite")
    m_desk_led.use_nodes = True
    nodes = m_desk_led.node_tree.nodes
    nodes.clear()
    out = nodes.new(type='ShaderNodeOutputMaterial')
    emit = nodes.new(type='ShaderNodeEmission')
    emit.inputs['Color'].default_value = (0.90, 0.95, 1.0, 1.0)
    emit.inputs['Strength'].default_value = 14.0
    m_desk_led.node_tree.links.new(emit.outputs['Emission'], out.inputs['Surface'])
    mats['desk_led'] = m_desk_led

    # --- IMAC M4 MATERIALS ---
    m_chin = bpy.data.materials.new(name="iMac_PastelMint_Alum")
    m_chin.use_nodes = True
    b = m_chin.node_tree.nodes.get("Principled BSDF")
    b.inputs['Base Color'].default_value = (0.58, 0.78, 0.67, 1.0)
    b.inputs['Metallic'].default_value = 0.88
    b.inputs['Roughness'].default_value = 0.24
    mats['chin'] = m_chin

    m_body = bpy.data.materials.new(name="iMac_Emerald_Alum")
    m_body.use_nodes = True
    b = m_body.node_tree.nodes.get("Principled BSDF")
    b.inputs['Base Color'].default_value = (0.16, 0.44, 0.28, 1.0)
    b.inputs['Metallic'].default_value = 0.94
    b.inputs['Roughness'].default_value = 0.18
    mats['body'] = m_body

    m_bezel = bpy.data.materials.new(name="iMac_White_GlassBezel")
    m_bezel.use_nodes = True
    b = m_bezel.node_tree.nodes.get("Principled BSDF")
    b.inputs['Base Color'].default_value = (0.94, 0.95, 0.95, 1.0)
    b.inputs['Roughness'].default_value = 0.04
    mats['bezel'] = m_bezel

    m_disp = bpy.data.materials.new(name="iMac_Screen_Graphic")
    m_disp.use_nodes = True
    nodes = m_disp.node_tree.nodes
    links = m_disp.node_tree.links
    nodes.clear()
    out = nodes.new(type='ShaderNodeOutputMaterial')
    bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    bsdf.inputs['Roughness'].default_value = 0.02
    tc = nodes.new(type='ShaderNodeTexCoord')
    mapping = nodes.new(type='ShaderNodeMapping')
    mapping.inputs['Rotation'].default_value = (0, 0, math.radians(-12))
    wave = nodes.new(type='ShaderNodeTexWave')
    wave.wave_type = 'BANDS'
    wave.bands_direction = 'X'
    wave.inputs['Scale'].default_value = 8.5
    wave.inputs['Distortion'].default_value = 2.4
    ramp = nodes.new(type='ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = 0.08
    ramp.color_ramp.elements[0].color = (0.78, 0.96, 0.84, 1.0)
    ramp.color_ramp.elements[1].position = 0.72
    ramp.color_ramp.elements[1].color = (0.18, 0.62, 0.36, 1.0)
    links.new(tc.outputs['Generated'], mapping.inputs['Vector'])
    links.new(mapping.outputs['Vector'], wave.inputs['Vector'])
    links.new(wave.outputs['Color'], ramp.inputs['Fac'])
    links.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])
    if 'Emission Color' in bsdf.inputs:
        links.new(ramp.outputs['Color'], bsdf.inputs['Emission Color'])
        bsdf.inputs['Emission Strength'].default_value = 0.45
    elif 'Emission' in bsdf.inputs:
        links.new(ramp.outputs['Color'], bsdf.inputs['Emission'])
    links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    mats['display'] = m_disp

    m_cam = bpy.data.materials.new(name="iMac_Camera_Glass")
    m_cam.use_nodes = True
    b = m_cam.node_tree.nodes.get("Principled BSDF")
    b.inputs['Base Color'].default_value = (0.01, 0.01, 0.015, 1.0)
    b.inputs['Roughness'].default_value = 0.02
    mats['camera'] = m_cam

    m_logo = bpy.data.materials.new(name="iMac_RearLogo_Gloss")
    m_logo.use_nodes = True
    b = m_logo.node_tree.nodes.get("Principled BSDF")
    b.inputs['Base Color'].default_value = (0.06, 0.22, 0.12, 1.0)
    b.inputs['Metallic'].default_value = 0.98
    b.inputs['Roughness'].default_value = 0.04
    mats['logo'] = m_logo

    m_plastic = bpy.data.materials.new(name="iMac_White_Plastic")
    m_plastic.use_nodes = True
    b = m_plastic.node_tree.nodes.get("Principled BSDF")
    b.inputs['Base Color'].default_value = (0.93, 0.94, 0.95, 1.0)
    b.inputs['Roughness'].default_value = 0.35
    mats['plastic'] = m_plastic

    m_tray = bpy.data.materials.new(name="iMac_KeyTray_Bed")
    m_tray.use_nodes = True
    b = m_tray.node_tree.nodes.get("Principled BSDF")
    b.inputs['Base Color'].default_value = (0.42, 0.60, 0.50, 1.0)
    b.inputs['Metallic'].default_value = 0.80
    b.inputs['Roughness'].default_value = 0.40
    mats['tray'] = m_tray

    # --- FLOWER MATERIALS ---
    m_glass = bpy.data.materials.new(name="Floral_Clear_Glass")
    m_glass.use_nodes = True
    b = m_glass.node_tree.nodes.get("Principled BSDF")
    b.inputs['Roughness'].default_value = 0.02
    if 'Transmission Weight' in b.inputs:
        b.inputs['Transmission Weight'].default_value = 1.0
    elif 'Transmission' in b.inputs:
        b.inputs['Transmission'].default_value = 1.0
    b.inputs['IOR'].default_value = 1.50
    mats['glass'] = m_glass

    m_water = bpy.data.materials.new(name="Floral_Water")
    m_water.use_nodes = True
    b = m_water.node_tree.nodes.get("Principled BSDF")
    b.inputs['Base Color'].default_value = (0.92, 0.98, 0.97, 1.0)
    b.inputs['Roughness'].default_value = 0.01
    if 'Transmission Weight' in b.inputs:
        b.inputs['Transmission Weight'].default_value = 1.0
    elif 'Transmission' in b.inputs:
        b.inputs['Transmission'].default_value = 1.0
    b.inputs['IOR'].default_value = 1.333
    mats['water'] = m_water

    m_ribbon = bpy.data.materials.new(name="Floral_Olive_Ribbon")
    m_ribbon.use_nodes = True
    b = m_ribbon.node_tree.nodes.get("Principled BSDF")
    b.inputs['Base Color'].default_value = (0.18, 0.24, 0.10, 1.0)
    b.inputs['Roughness'].default_value = 0.32
    if 'Sheen Weight' in b.inputs:
        b.inputs['Sheen Weight'].default_value = 0.70
    elif 'Sheen' in b.inputs:
        b.inputs['Sheen'].default_value = 0.70
    mats['ribbon'] = m_ribbon

    m_lily = bpy.data.materials.new(name="Floral_Orange_Lily")
    m_lily.use_nodes = True
    nodes = m_lily.node_tree.nodes
    links = m_lily.node_tree.links
    nodes.clear()
    out = nodes.new(type='ShaderNodeOutputMaterial')
    bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    bsdf.inputs['Roughness'].default_value = 0.40
    if 'Subsurface Weight' in bsdf.inputs:
        bsdf.inputs['Subsurface Weight'].default_value = 0.25
        bsdf.inputs['Subsurface Radius'].default_value = (1.0, 0.4, 0.1)
    elif 'Subsurface' in bsdf.inputs:
        bsdf.inputs['Subsurface'].default_value = 0.25
    tc = nodes.new(type='ShaderNodeTexCoord')
    grad = nodes.new(type='ShaderNodeTexGradient')
    grad.gradient_type = 'RADIAL'
    ramp = nodes.new(type='ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color = (0.95, 0.45, 0.04, 1.0)
    ramp.color_ramp.elements[1].position = 0.8
    ramp.color_ramp.elements[1].color = (0.98, 0.65, 0.12, 1.0)
    links.new(tc.outputs['Generated'], grad.inputs['Vector'])
    links.new(grad.outputs['Fac'], ramp.inputs['Fac'])
    links.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])
    links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    mats['lily'] = m_lily

    m_rose = bpy.data.materials.new(name="Floral_Orange_Rose")
    m_rose.use_nodes = True
    b = m_rose.node_tree.nodes.get("Principled BSDF")
    b.inputs['Base Color'].default_value = (0.92, 0.38, 0.05, 1.0)
    b.inputs['Roughness'].default_value = 0.48
    if 'Subsurface Weight' in b.inputs:
        b.inputs['Subsurface Weight'].default_value = 0.20
    elif 'Subsurface' in b.inputs:
        b.inputs['Subsurface'].default_value = 0.20
    mats['rose'] = m_rose

    m_leaf = bpy.data.materials.new(name="Floral_Foliage_Green")
    m_leaf.use_nodes = True
    b = m_leaf.node_tree.nodes.get("Principled BSDF")
    b.inputs['Base Color'].default_value = (0.12, 0.25, 0.14, 1.0)
    b.inputs['Roughness'].default_value = 0.38
    mats['leaf'] = m_leaf

    m_stem = bpy.data.materials.new(name="Floral_Stem_Green")
    m_stem.use_nodes = True
    b = m_stem.node_tree.nodes.get("Principled BSDF")
    b.inputs['Base Color'].default_value = (0.10, 0.22, 0.08, 1.0)
    b.inputs['Roughness'].default_value = 0.45
    mats['stem'] = m_stem

    return mats

def add_box(bm, cx, cy, cz, sx, sy, sz):
    dx, dy, dz = sx / 2.0, sy / 2.0, sz / 2.0
    v1 = bm.verts.new((cx - dx, cy - dy, cz - dz))
    v2 = bm.verts.new((cx + dx, cy - dy, cz - dz))
    v3 = bm.verts.new((cx + dx, cy + dy, cz - dz))
    v4 = bm.verts.new((cx - dx, cy + dy, cz - dz))
    v5 = bm.verts.new((cx - dx, cy - dy, cz + dz))
    v6 = bm.verts.new((cx + dx, cy - dy, cz + dz))
    v7 = bm.verts.new((cx + dx, cy + dy, cz + dz))
    v8 = bm.verts.new((cx - dx, cy + dy, cz + dz))
    bm.faces.new([v1, v2, v3, v4])
    bm.faces.new([v8, v7, v6, v5])
    bm.faces.new([v1, v5, v6, v2])
    bm.faces.new([v2, v6, v7, v3])
    bm.faces.new([v3, v7, v8, v4])
    bm.faces.new([v4, v8, v5, v1])

def add_clean_bevel(obj, width=0.003, segments=3):
    bev = obj.modifiers.new(name="EdgeBevel", type='BEVEL')
    bev.width = width
    bev.segments = segments
    bev.limit_method = 'ANGLE'
    bev.angle_limit = math.radians(35)
    for p in obj.data.polygons:
        p.use_smooth = True

# =============================================================================
# STATION 1: RICARDO FASANELLO "ANEL" CHAIR (Separated to X = -3.5m)
# =============================================================================
def build_station_chair(mats, origin_x=-3.500):
    root = bpy.data.objects.new("Station_1_Anel_Chair", None)
    bpy.context.collection.objects.link(root)
    root.location = (origin_x, 0, 0)

    seat_bowl = bpy.data.objects.new("Chair_Bowl_Rig", None)
    bpy.context.collection.objects.link(seat_bowl)
    seat_bowl.parent = root
    seat_bowl.location = (0, 0.08, 0.56)
    seat_bowl.rotation_euler = (math.radians(-48), 0, 0)

    rings = [
        ("Ring_1", 0.53, 0.075,  0.10),
        ("Ring_2", 0.40, 0.062,  0.03),
        ("Ring_3", 0.28, 0.052, -0.04),
        ("Ring_4", 0.17, 0.042, -0.09),
    ]

    for name, r_maj, r_min, z_off in rings:
        bpy.ops.mesh.primitive_torus_add(major_radius=r_maj, minor_radius=r_min, major_segments=72, minor_segments=32, location=(0, 0, z_off))
        cush = bpy.context.active_object
        cush.name = f"{name}_Cushion"
        cush.parent = seat_bowl
        cush.data.materials.append(mats['chair_fabric'])
        bpy.ops.object.shade_smooth()

        bpy.ops.mesh.primitive_torus_add(major_radius=r_maj - r_min*0.4, minor_radius=r_min*0.25, major_segments=72, minor_segments=20, location=(0, 0, z_off - r_min*0.45))
        rim = bpy.context.active_object
        rim.name = f"{name}_Rim"
        rim.parent = seat_bowl
        rim.data.materials.append(mats['chair_wood'])
        bpy.ops.object.shade_smooth()

    # Center Disc
    bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.06, vertices=64, location=(0, 0, -0.11))
    c_disc = bpy.context.active_object
    c_disc.name = "Center_Cushion"
    c_disc.parent = seat_bowl
    c_disc.data.materials.append(mats['chair_fabric'])
    bev = c_disc.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.02
    bev.segments = 4
    bpy.ops.object.shade_smooth()

    # Bentwood Cradle Side Arms
    for side, sign in [("Right", 1.0), ("Left", -1.0)]:
        pts = [
            (sign * 0.52, -0.08, 0.62),
            (sign * 0.49, -0.22, 0.48),
            (sign * 0.38, -0.05, 0.38),
            (sign * 0.41,  0.25, 0.45),
        ]
        c_data = bpy.data.curves.new(name=f"Bentwood_Cradle_{side}", type='CURVE')
        c_data.dimensions = '3D'
        c_data.bevel_depth = 0.034
        c_data.bevel_resolution = 6
        c_data.fill_mode = 'FULL'
        spl = c_data.splines.new('BEZIER')
        spl.bezier_points.add(len(pts) - 1)
        for i, pt in enumerate(pts):
            spl.bezier_points[i].co = pt
            spl.bezier_points[i].handle_left_type = 'AUTO'
            spl.bezier_points[i].handle_right_type = 'AUTO'
        obj_arm = bpy.data.objects.new(f"Bentwood_Cradle_{side}", c_data)
        bpy.context.collection.objects.link(obj_arm)
        obj_arm.parent = root
        obj_arm.data.materials.append(mats['chair_wood'])

    # Splayed Legs
    legs = [
        ("Leg_FR", ( 0.42, -0.20, 0.45), ( 0.48, -0.38, 0.0)),
        ("Leg_FL", (-0.42, -0.20, 0.45), (-0.48, -0.38, 0.0)),
        ("Leg_BR", ( 0.36,  0.23, 0.42), ( 0.42,  0.48, 0.0)),
        ("Leg_BL", (-0.36,  0.23, 0.42), (-0.42,  0.48, 0.0)),
    ]
    for name, top, bot in legs:
        bm_leg = bmesh.new()
        segs = 20
        top_v, bot_v = [top[0], top[1], top[2]], [bot[0], bot[1], bot[2]]
        rt, rb = 0.032, 0.018
        for i in range(segs):
            th = 2.0 * math.pi * i / segs
            bm_leg.verts.new((top_v[0] + rt*math.cos(th), top_v[1] + rt*math.sin(th), top_v[2]))
            bm_leg.verts.new((bot_v[0] + rb*math.cos(th), bot_v[1] + rb*math.sin(th), bot_v[2]))
        bm_leg.verts.ensure_lookup_table()
        for i in range(segs):
            i_next = (i + 1) % segs
            bm_leg.faces.new([bm_leg.verts[i*2], bm_leg.verts[i*2+1], bm_leg.verts[i_next*2+1], bm_leg.verts[i_next*2]])
        bm_leg.faces.new([bm_leg.verts[i*2] for i in reversed(range(segs))])
        bm_leg.faces.new([bm_leg.verts[i*2+1] for i in range(segs)])
        mesh_l = bpy.data.meshes.new(name)
        bm_leg.to_mesh(mesh_l)
        bm_leg.free()
        obj_l = bpy.data.objects.new(name, mesh_l)
        bpy.context.collection.objects.link(obj_l)
        obj_l.parent = root
        obj_l.data.materials.append(mats['chair_wood'])
        for p in obj_l.data.polygons:
            p.use_smooth = True

# =============================================================================
# STATION 2: RECEPTION COUNTER (Separated at X = 0m)
# =============================================================================
def build_station_reception_desk(mats, origin_x=0.000):
    root = bpy.data.objects.new("Station_2_Reception_Desk", None)
    bpy.context.collection.objects.link(root)
    root.location = (origin_x, 0, 0)

    plinth_h = 0.080
    high_h = 1.080
    low_h = 0.750
    desk_d = 0.780

    # 1. Base Plinth
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.10, 0.0, plinth_h / 2.0), scale=(3.250, desk_d - 0.080, plinth_h))
    plinth = bpy.context.active_object
    plinth.name = "Desk_Black_Plinth"
    bpy.ops.object.transform_apply(scale=True)
    plinth.parent = root
    plinth.data.materials.append(mats['desk_black'])

    # 2. Lower Desk Block
    low_w = 1.550
    low_center_x = 0.850
    low_center_z = plinth_h + ((low_h - plinth_h) / 2.0)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(low_center_x, 0.0, low_center_z), scale=(low_w, desk_d, low_h - plinth_h))
    low_desk = bpy.context.active_object
    low_desk.name = "Desk_Lower_Section"
    bpy.ops.object.transform_apply(scale=True)
    low_desk.parent = root
    low_desk.data.materials.append(mats['desk_white'])
    add_clean_bevel(low_desk, width=0.003, segments=3)

    # 3. Upper High Counter with Angled Wing
    bm_high = bmesh.new()
    y_front = -desk_d / 2.0
    y_back  =  desk_d / 2.0
    x_far_left = -1.650
    x_top_left = -1.450
    x_step     =  0.080

    pts_left = [
        (x_far_left, plinth_h),
        (x_top_left, high_h),
        (x_step,     high_h),
        (x_step,     low_h)
    ]
    v_front = [bm_high.verts.new((px, y_front, pz)) for px, pz in pts_left]
    v_back  = [bm_high.verts.new((px, y_back,  pz)) for px, pz in pts_left]

    bm_high.faces.new([v_front[0], v_front[1], v_front[2], v_front[3]])
    bm_high.faces.new([v_back[3],  v_back[2],  v_back[1],  v_back[0]])
    bm_high.faces.new([v_front[0], v_back[0], v_back[1], v_front[1]])
    bm_high.faces.new([v_front[1], v_back[1], v_back[2], v_front[2]])
    bm_high.faces.new([v_front[2], v_back[2], v_back[3], v_front[3]])
    bm_high.faces.new([v_front[3], v_back[3], v_back[0], v_front[0]])

    mesh_high = bpy.data.meshes.new("Desk_High_Upper_Hull_Mesh")
    bm_high.to_mesh(mesh_high)
    bm_high.free()
    obj_high = bpy.data.objects.new("Desk_High_Upper_Hull", mesh_high)
    bpy.context.collection.objects.link(obj_high)
    obj_high.parent = root
    obj_high.data.materials.append(mats['desk_white'])
    add_clean_bevel(obj_high, width=0.003, segments=3)

    # 4. Front Inset Grey Panel
    bm_inset = bmesh.new()
    p_inset = [
        (x_far_left + 0.070, plinth_h + 0.020),
        (x_top_left + 0.065, high_h   - 0.065),
        (x_step     - 0.060, high_h   - 0.065),
        (x_step     - 0.060, plinth_h + 0.020)
    ]
    v_inset = [bm_inset.verts.new((px, y_front - 0.001, pz)) for px, pz in p_inset]
    bm_inset.faces.new(v_inset)
    bmesh.ops.solidify(bm_inset, geom=bm_inset.faces[:], thickness=0.005)
    mesh_inset = bpy.data.meshes.new("Desk_Front_Inset_Panel_Mesh")
    bm_inset.to_mesh(mesh_inset)
    bm_inset.free()
    obj_inset = bpy.data.objects.new("Desk_Front_Inset_Panel", mesh_inset)
    bpy.context.collection.objects.link(obj_inset)
    obj_inset.parent = root
    obj_inset.data.materials.append(mats['desk_grey'])
    for p in obj_inset.data.polygons:
        p.use_smooth = True

    # 5. Front Floating Overlapping White Block
    block_w, block_h, block_d = 0.650, 0.400, 0.050
    block_x = x_step - (block_w / 2.0) + 0.080
    block_z = plinth_h + (block_h / 2.0)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(block_x, y_front - 0.025, block_z), scale=(block_w, block_d, block_h))
    front_block = bpy.context.active_object
    front_block.name = "Desk_Front_Floating_Block"
    bpy.ops.object.transform_apply(scale=True)
    front_block.parent = root
    front_block.data.materials.append(mats['desk_white'])
    add_clean_bevel(front_block, width=0.0025, segments=3)

    # 6. Indirect LED Channel
    curve_data = bpy.data.curves.new(name="LED_Strip_Curve", type='CURVE')
    curve_data.dimensions = '3D'
    curve_data.bevel_depth = 0.009
    curve_data.bevel_resolution = 4
    curve_data.fill_mode = 'FULL'
    spline = curve_data.splines.new('POLY')
    led_pts = [
        (x_far_left + 0.075, y_front - 0.012, plinth_h + 0.020),
        (x_top_left + 0.070, y_front - 0.012, high_h   - 0.060),
        (block_x - (block_w / 2.0) - 0.015, y_front - 0.012, high_h - 0.060),
        (block_x - (block_w / 2.0) - 0.015, y_front - 0.012, plinth_h + block_h + 0.010),
    ]
    spline.points.add(len(led_pts) - 1)
    for i, pt in enumerate(led_pts):
        spline.points[i].co = (pt[0], pt[1], pt[2], 1.0)
    obj_led = bpy.data.objects.new("Desk_LED_Light_Strip", curve_data)
    bpy.context.collection.objects.link(obj_led)
    obj_led.parent = root
    obj_led.data.materials.append(mats['desk_led'])

    # 7. Internal Rear Desk Worksurface
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.720, 0.080, 0.750 - 0.015), scale=(1.620, 0.520, 0.030))
    work_surface = bpy.context.active_object
    work_surface.name = "Desk_Receptionist_Counter"
    bpy.ops.object.transform_apply(scale=True)
    work_surface.parent = root
    work_surface.data.materials.append(mats['desk_white'])

# =============================================================================
# STATION 3: STANDALONE IMAC M4 SETUP (Separated to X = +3.5m)
# =============================================================================
def build_station_imac(mats, origin_x=3.500):
    root = bpy.data.objects.new("Station_3_iMac_Setup", None)
    bpy.context.collection.objects.link(root)
    root.location = (origin_x, 0, 0)

    W, H, D = 0.547, 0.461, 0.0115
    chin_h, border = 0.142, 0.018
    screen_base_z = 0.112
    screen_mid_z = screen_base_z + (H / 2.0)

    # Chassis
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, screen_mid_z), scale=(W, D, H))
    chassis = bpy.context.active_object
    chassis.name = "iMac_Chassis"
    bpy.ops.object.transform_apply(scale=True)
    chassis.parent = root
    chassis.data.materials.append(mats['body'])
    bev = chassis.modifiers.new("Bevel", 'BEVEL')
    bev.width = 0.0032
    bev.segments = 4

    front_y = -(D / 2.0) - 0.0004
    chin_z = screen_base_z + (chin_h / 2.0)
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, front_y, chin_z), rotation=(math.radians(90), 0, 0), scale=(W * 0.998, chin_h * 0.998, 1.0))
    chin = bpy.context.active_object
    chin.name = "iMac_Chin_Panel"
    bpy.ops.object.transform_apply(scale=True)
    chin.parent = root
    chin.data.materials.append(mats['chin'])

    bezel_h = H - chin_h
    bezel_z = screen_base_z + chin_h + (bezel_h / 2.0)
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, front_y, bezel_z), rotation=(math.radians(90), 0, 0), scale=(W * 0.998, bezel_h * 0.998, 1.0))
    bezel = bpy.context.active_object
    bezel.name = "iMac_White_Glass_Bezel"
    bpy.ops.object.transform_apply(scale=True)
    bezel.parent = root
    bezel.data.materials.append(mats['bezel'])

    disp_w, disp_h = W - (border * 2.0), bezel_h - (border * 2.0)
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, front_y - 0.0003, bezel_z), rotation=(math.radians(90), 0, 0), scale=(disp_w, disp_h, 1.0))
    screen = bpy.context.active_object
    screen.name = "iMac_Display_Screen"
    bpy.ops.object.transform_apply(scale=True)
    screen.parent = root
    screen.data.materials.append(mats['display'])

    bpy.ops.mesh.primitive_circle_add(radius=0.0028, fill_type='NGON', location=(0, front_y - 0.0005, screen_base_z + H - border/2.0), rotation=(math.radians(90), 0, 0))
    cam = bpy.context.active_object
    cam.name = "iMac_Camera"
    cam.parent = root
    cam.data.materials.append(mats['camera'])

    # Rear Apple Logo
    rear_y = (D / 2.0) + 0.0003
    logo_scale = 0.046
    logo_z = screen_mid_z + 0.022
    body_spline_data = [
        ( 0.000,  0.505,  0.060,  0.505, -0.060,  0.505),
        (-0.220,  0.560, -0.130,  0.540, -0.340,  0.560),
        (-0.490,  0.420, -0.430,  0.520, -0.535,  0.335),
        (-0.270,  0.190, -0.420,  0.300, -0.270,  0.060),
        (-0.520, -0.060, -0.390, -0.070, -0.550, -0.220),
        (-0.430, -0.440, -0.530, -0.340, -0.320, -0.550),
        (-0.150, -0.560, -0.240, -0.560, -0.070, -0.530),
        ( 0.000, -0.510, -0.050, -0.510,  0.050, -0.510),
        ( 0.150, -0.560,  0.070, -0.530,  0.240, -0.560),
        ( 0.430, -0.440,  0.320, -0.550,  0.530, -0.340),
        ( 0.550, -0.080,  0.550, -0.240,  0.550,  0.150),
        ( 0.490,  0.380,  0.540,  0.260,  0.380,  0.520),
        ( 0.210,  0.560,  0.320,  0.560,  0.120,  0.540),
    ]
    c_logo = bpy.data.curves.new(name="Apple_Logo_Curve", type='CURVE')
    c_logo.dimensions = '2D'
    c_logo.extrude = 0.0006
    c_logo.bevel_depth = 0.00015
    spl_b = c_logo.splines.new('BEZIER')
    spl_b.bezier_points.add(len(body_spline_data) - 1)
    for i, pt in enumerate(body_spline_data):
        bp = spl_b.bezier_points[i]
        bp.co = (pt[0] * logo_scale, pt[1] * logo_scale, 0)
        bp.handle_left = (pt[2] * logo_scale, pt[3] * logo_scale, 0)
        bp.handle_right = (pt[4] * logo_scale, pt[5] * logo_scale, 0)
        bp.handle_left_type = 'FREE'
        bp.handle_right_type = 'FREE'
    spl_b.use_cyclic_u = True

    spl_l = c_logo.splines.new('BEZIER')
    spl_l.bezier_points.add(2)
    spl_l.bezier_points[0].co = (-0.025 * logo_scale, 0.580 * logo_scale, 0)
    spl_l.bezier_points[0].handle_left = (0.030 * logo_scale, 0.680 * logo_scale, 0)
    spl_l.bezier_points[0].handle_right = (-0.100 * logo_scale, 0.550 * logo_scale, 0)
    spl_l.bezier_points[1].co = (-0.245 * logo_scale, 0.900 * logo_scale, 0)
    spl_l.bezier_points[1].handle_left = (-0.160 * logo_scale, 0.880 * logo_scale, 0)
    spl_l.bezier_points[1].handle_right = (-0.280 * logo_scale, 0.930 * logo_scale, 0)
    spl_l.bezier_points[2].co = (-0.220 * logo_scale, 0.700 * logo_scale, 0)
    spl_l.bezier_points[2].handle_left = (-0.280 * logo_scale, 0.790 * logo_scale, 0)
    spl_l.bezier_points[2].handle_right = (-0.120 * logo_scale, 0.610 * logo_scale, 0)
    spl_l.use_cyclic_u = True

    logo_obj = bpy.data.objects.new("iMac_Apple_Logo_Vector", c_logo)
    bpy.context.collection.objects.link(logo_obj)
    logo_obj.rotation_euler = (math.radians(90), 0, 0)
    logo_obj.location = (0, rear_y, logo_z)
    logo_obj.parent = root
    logo_obj.data.materials.append(mats['logo'])

    # Stand
    stand_w, stand_foot_d, stand_thick = 0.130, 0.145, 0.004
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.008, stand_thick / 2.0), scale=(stand_w, stand_foot_d, stand_thick))
    s_foot = bpy.context.active_object
    s_foot.name = "iMac_Stand_Base"
    bpy.ops.object.transform_apply(scale=True)
    s_foot.parent = root
    s_foot.data.materials.append(mats['body'])

    neck_h = 0.205
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.010, screen_base_z + chin_h * 0.35), rotation=(math.radians(8), 0, 0), scale=(stand_w, stand_thick, neck_h))
    s_neck = bpy.context.active_object
    s_neck.name = "iMac_Stand_Neck"
    bpy.ops.object.transform_apply(scale=True)
    s_neck.parent = root
    s_neck.data.materials.append(mats['body'])

    # Keyboard
    kb_w, kb_d = 0.2789, 0.1149
    kb_y = -0.220
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, kb_y, 0.004), scale=(kb_w, kb_d, 0.008))
    kb = bpy.context.active_object
    kb.name = "Magic_Keyboard"
    bpy.ops.object.transform_apply(scale=True)
    kb.parent = root
    kb.data.materials.append(mats['chin'])
    add_clean_bevel(kb, width=0.003, segments=3)

    # Mouse
    mw, ml, mh = 0.0571, 0.1135, 0.0216
    mx, my = 0.220, kb_y
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(mx, my, 0.003), scale=(mw * 0.90, ml * 0.94, 0.006))
    m_base = bpy.context.active_object
    m_base.name = "Magic_Mouse_Base"
    bpy.ops.object.transform_apply(scale=True)
    m_base.parent = root
    m_base.data.materials.append(mats['chin'])

    bm_m = bmesh.new()
    steps_x, steps_y = 12, 24
    m_grid = []
    for j in range(steps_y + 1):
        row = []
        ny = -1.0 + (2.0 * j / steps_y)
        w_scale = 1.0 - (0.07 * (ny + 0.3)**2)
        for i in range(steps_x + 1):
            nx = -1.0 + (2.0 * i / steps_x)
            vx = nx * (mw / 2.0) * w_scale
            vy = ny * (ml / 2.0)
            arch_y = math.cos((ny + 0.15) * (math.pi / 2.3))
            arch_x = math.cos(nx * (math.pi / 2.2))
            vz = 0.006 + (mh - 0.006) * (arch_y * arch_x)
            if i in [0, steps_x] or j in [0, steps_y]:
                vz = 0.0055
            row.append(bm_m.verts.new((vx, vy, vz)))
        m_grid.append(row)
    for j in range(steps_y):
        for i in range(steps_x):
            bm_m.faces.new([m_grid[j][i], m_grid[j][i+1], m_grid[j+1][i+1], m_grid[j+1][i]])
    bmesh.ops.solidify(bm_m, geom=bm_m.faces[:], thickness=-0.0012)
    m_top_mesh = bpy.data.meshes.new("Magic_Mouse_Top_Mesh")
    bm_m.to_mesh(m_top_mesh)
    bm_m.free()
    m_top_obj = bpy.data.objects.new("Magic_Mouse_Top", m_top_mesh)
    bpy.context.collection.objects.link(m_top_obj)
    m_top_obj.location = (mx, my, 0)
    m_top_obj.parent = root
    m_top_obj.data.materials.append(mats['plastic'])
    for p in m_top_obj.data.polygons:
        p.use_smooth = True

# =============================================================================
# STATION 4: BLISSFUL ORANGE FLORAL ARRANGEMENT (Separated to X = +6.0m)
# =============================================================================
def build_station_flowers(mats, origin_x=6.000):
    root = bpy.data.objects.new("Station_4_Floral_Arrangement", None)
    bpy.context.collection.objects.link(root)
    root.location = (origin_x, 0, 0)

    # 1. Glass Vase & Water
    bm_vase = bmesh.new()
    bm_water = bmesh.new()
    segments = 36
    profile = [
        (0.048, 0.000), (0.052, 0.015), (0.075, 0.060),
        (0.072, 0.110), (0.052, 0.165), (0.058, 0.190)
    ]
    rings = []
    for r, z in profile:
        ring = [bm_vase.verts.new((r * math.cos(2*math.pi*i/segments), r * math.sin(2*math.pi*i/segments), z)) for i in range(segments)]
        rings.append(ring)
    for j in range(len(rings) - 1):
        for i in range(segments):
            i_next = (i + 1) % segments
            bm_vase.faces.new([rings[j][i], rings[j][i_next], rings[j+1][i_next], rings[j+1][i]])
    bm_vase.faces.new([rings[0][i] for i in reversed(range(segments))])
    bmesh.ops.solidify(bm_vase, geom=bm_vase.faces[:], thickness=0.0035)
    mesh_v = bpy.data.meshes.new("Glass_Vase_Mesh")
    bm_vase.to_mesh(mesh_v)
    bm_vase.free()
    obj_v = bpy.data.objects.new("Glass_Vase", mesh_v)
    bpy.context.collection.objects.link(obj_v)
    obj_v.parent = root
    obj_v.data.materials.append(mats['glass'])
    for p in obj_v.data.polygons:
        p.use_smooth = True

    w_profile = [(r * 0.96, z) for r, z in profile[:4]] + [(0.065 * 0.96, 0.130)]
    w_rings = []
    for r, z in w_profile:
        ring = [bm_water.verts.new((r * math.cos(2*math.pi*i/segments), r * math.sin(2*math.pi*i/segments), z + 0.004)) for i in range(segments)]
        w_rings.append(ring)
    for j in range(len(w_rings) - 1):
        for i in range(segments):
            i_next = (i + 1) % segments
            bm_water.faces.new([w_rings[j][i], w_rings[j][i_next], w_rings[j+1][i_next], w_rings[j+1][i]])
    bm_water.faces.new([w_rings[0][i] for i in reversed(range(segments))])
    bm_water.faces.new([w_rings[-1][i] for i in range(segments)])
    mesh_w = bpy.data.meshes.new("Vase_Water_Mesh")
    bm_water.to_mesh(mesh_w)
    bm_water.free()
    obj_w = bpy.data.objects.new("Vase_Water", mesh_w)
    bpy.context.collection.objects.link(obj_w)
    obj_w.parent = root
    obj_w.data.materials.append(mats['water'])
    for p in obj_w.data.polygons:
        p.use_smooth = True

    # 2. Ribbon Bow
    c_data = bpy.data.curves.new(name="Ribbon_Curve", type='CURVE')
    c_data.dimensions = '3D'
    c_data.bevel_depth = 0.0018
    c_data.extrude = 0.007
    neck_z, neck_r = 0.165, 0.054
    spline_col = c_data.splines.new('POLY')
    spline_col.points.add(15)
    for i in range(16):
        th = 2.0 * math.pi * i / 16
        spline_col.points[i].co = (neck_r * math.cos(th), neck_r * math.sin(th), neck_z, 1.0)
    spline_col.use_cyclic_u = True

    for sign in [-1.0, 1.0]:
        spl = c_data.splines.new('BEZIER')
        spl.bezier_points.add(2)
        spl.bezier_points[0].co = (0.0, -neck_r - 0.004, neck_z)
        spl.bezier_points[0].handle_left = (-sign * 0.015, -neck_r, neck_z)
        spl.bezier_points[0].handle_right = (sign * 0.025, -neck_r - 0.025, neck_z + 0.015)
        spl.bezier_points[1].co = (sign * 0.045, -neck_r - 0.035, neck_z + 0.022)
        spl.bezier_points[1].handle_left = (sign * 0.035, -neck_r - 0.040, neck_z + 0.010)
        spl.bezier_points[1].handle_right = (sign * 0.040, -neck_r - 0.020, neck_z + 0.030)
        spl.bezier_points[2].co = (0.0, -neck_r - 0.004, neck_z)
        spl.bezier_points[2].handle_left = (sign * 0.020, -neck_r - 0.010, neck_z + 0.010)
        spl.bezier_points[2].handle_right = (0.0, -neck_r - 0.004, neck_z)
        spl.use_cyclic_u = True

        tail = c_data.splines.new('BEZIER')
        tail.bezier_points.add(2)
        tail.bezier_points[0].co = (sign * 0.005, -neck_r - 0.006, neck_z)
        tail.bezier_points[0].handle_left = (0, -neck_r, neck_z)
        tail.bezier_points[0].handle_right = (sign * 0.010, -neck_r - 0.015, neck_z - 0.020)
        tail.bezier_points[1].co = (sign * 0.022, -neck_r - 0.018, neck_z - 0.055)
        tail.bezier_points[1].handle_left = (sign * 0.015, -neck_r - 0.016, neck_z - 0.035)
        tail.bezier_points[1].handle_right = (sign * 0.028, -neck_r - 0.019, neck_z - 0.075)
        tail.bezier_points[2].co = (sign * 0.032, -neck_r - 0.012, neck_z - 0.095)
        tail.bezier_points[2].handle_left = (sign * 0.028, -neck_r - 0.015, neck_z - 0.080)
        tail.bezier_points[2].handle_right = (sign * 0.032, -neck_r - 0.012, neck_z - 0.095)

    obj_rib = bpy.data.objects.new("Green_Satin_Ribbon_Bow", c_data)
    bpy.context.collection.objects.link(obj_rib)
    obj_rib.parent = root
    obj_rib.data.materials.append(mats['ribbon'])

    # 3. Lilies, Roses, Stems, Foliage
    random.seed(42)
    bm_s = bmesh.new()
    for _ in range(24):
        th = random.uniform(0, 2*math.pi)
        rb = random.uniform(0.010, 0.045)
        bot = (rb * math.cos(th), rb * math.sin(th), random.uniform(0.02, 0.05))
        rt = random.uniform(0.08, 0.18)
        top = (rt * math.cos(th + random.uniform(-0.5, 0.5)), rt * math.sin(th + random.uniform(-0.5, 0.5)), random.uniform(0.24, 0.38))
        sw = 0.0028
        bm_s.verts.new((bot[0] - sw, bot[1], bot[2]))
        bm_s.verts.new((bot[0] + sw, bot[1], bot[2]))
        bm_s.verts.new((top[0] + sw, top[1], top[2]))
        bm_s.verts.new((top[0] - sw, top[1], top[2]))
        bm_s.faces.new(bm_s.verts[-4:])
    mesh_s = bpy.data.meshes.new("Arrangement_Stems_Mesh")
    bm_s.to_mesh(mesh_s)
    bm_s.free()
    obj_s = bpy.data.objects.new("Arrangement_Stems", mesh_s)
    bpy.context.collection.objects.link(obj_s)
    obj_s.parent = root
    obj_s.data.materials.append(mats['stem'])

    # Lilies
    bm_l = bmesh.new()
    lily_pts = [
        ( 0.000, -0.060, 0.320, 1.25, math.radians(40),  0.0, 0.0),
        (-0.085, -0.040, 0.335, 1.15, math.radians(35), -math.radians(35), math.radians(-30)),
        ( 0.080, -0.035, 0.340, 1.18, math.radians(35),  math.radians(30), math.radians(25)),
        (-0.040,  0.050, 0.370, 1.20, math.radians(-25), -math.radians(20), math.radians(160)),
        ( 0.060,  0.045, 0.365, 1.15, math.radians(-25),  math.radians(25), math.radians(-160)),
    ]
    for lx, ly, lz, sc, rx, ry, rz in lily_pts:
        p_len = 0.065 * sc
        p_w = 0.025 * sc
        cx, sx = math.cos(rx), math.sin(rx)
        cy, sy = math.cos(ry), math.sin(ry)
        cz, sz = math.cos(rz), math.sin(rz)
        for layer, po in enumerate([0, math.pi / 3.0]):
            cd = 0.018 * sc * (1.1 - layer * 0.2)
            for p in range(3):
                ang = (2.0 * math.pi * p / 3.0) + po
                ca, sa = math.cos(ang), math.sin(ang)
                pa, sa_o = -sa, ca
                raw = [
                    (0.0, 0.0, 0.0),
                    (ca * p_len * 0.5 + pa * p_w, sa * p_len * 0.5 + sa_o * p_w, cd),
                    (ca * p_len, sa * p_len, cd * 1.6),
                    (ca * p_len * 0.5 - pa * p_w, sa * p_len * 0.5 - sa_o * p_w, cd)
                ]
                x_pts = []
                for x, y, z in raw:
                    x1, y1 = x*cz - y*sz, x*sz + y*cz
                    x2, z2 = x1*cy + z*sy, -x1*sy + z*cy
                    y3, z3 = y1*cx - z2*sx, y1*sx + z2*cx
                    x_pts.append(bm_l.verts.new((lx + x2, ly + y3, lz + z3)))
                bm_l.faces.new(x_pts)
    bmesh.ops.solidify(bm_l, geom=bm_l.faces[:], thickness=0.0008)
    mesh_l = bpy.data.meshes.new("Arrangement_Lilies_Mesh")
    bm_l.to_mesh(mesh_l)
    bm_l.free()
    obj_l = bpy.data.objects.new("Arrangement_Lilies", mesh_l)
    bpy.context.collection.objects.link(obj_l)
    obj_l.parent = root
    obj_l.data.materials.append(mats['lily'])
    for p in obj_l.data.polygons:
        p.use_smooth = True

    # Roses
    bm_r = bmesh.new()
    rose_pts = [
        (-0.045, -0.090, 0.275, 1.05, math.radians(55), -math.radians(20), 0),
        ( 0.055, -0.085, 0.280, 1.05, math.radians(50),  math.radians(25), 0),
        (-0.115,  0.010, 0.305, 1.00, math.radians(20), -math.radians(55), 0),
        ( 0.110,  0.015, 0.310, 1.00, math.radians(20),  math.radians(55), 0),
        ( 0.000,  0.010, 0.385, 1.10, 0, 0, 0),
        (-0.060,  0.080, 0.295, 0.95, math.radians(-45), -math.radians(35), 0),
        ( 0.065,  0.075, 0.300, 0.95, math.radians(-45),  math.radians(35), 0),
    ]
    for rx, ry, rz, sc, erx, ery, erz in rose_pts:
        cx, sx = math.cos(erx), math.sin(erx)
        cy, sy = math.cos(ery), math.sin(ery)
        cz, sz = math.cos(erz), math.sin(erz)
        for lay in range(4):
            cnt = 3 + lay
            rl = (0.012 + lay * 0.009) * sc
            hl = (0.022 - lay * 0.004) * sc
            for p in range(cnt):
                th = (2.0 * math.pi * p / cnt) + (lay * 0.6)
                ca, sa = math.cos(th), math.sin(th)
                w = 0.016 * sc
                raw = [
                    (ca * rl * 0.5, sa * rl * 0.5, 0.0),
                    (ca * rl - sa * w, sa * rl + ca * w, hl),
                    (ca * (rl + 0.008), sa * (rl + 0.008), hl * 0.85),
                    (ca * rl + sa * w, sa * rl - ca * w, hl)
                ]
                x_pts = []
                for x, y, z in raw:
                    x1, y1 = x*cz - y*sz, x*sz + y*cz
                    x2, z2 = x1*cy + z*sy, -x1*sy + z*cy
                    y3, z3 = y1*cx - z2*sx, y1*sx + z2*cx
                    x_pts.append(bm_r.verts.new((rx + x2, ry + y3, rz + z3)))
                bm_r.faces.new(x_pts)
    bmesh.ops.solidify(bm_r, geom=bm_r.faces[:], thickness=0.0006)
    mesh_r = bpy.data.meshes.new("Arrangement_Roses_Mesh")
    bm_r.to_mesh(mesh_r)
    bm_r.free()
    obj_r = bpy.data.objects.new("Arrangement_Roses", mesh_r)
    bpy.context.collection.objects.link(obj_r)
    obj_r.parent = root
    obj_r.data.materials.append(mats['rose'])
    for p in obj_r.data.polygons:
        p.use_smooth = True

    # Foliage
    bm_f = bmesh.new()
    for _ in range(22):
        cth = random.uniform(0, 2 * math.pi)
        cr = random.uniform(0.06, 0.16)
        cz = random.uniform(0.24, 0.35)
        fx, fy = cr * math.cos(cth), cr * math.sin(cth)
        lw, lh = 0.014, 0.024
        ca, sa = math.cos(cth), math.sin(cth)
        v0 = bm_f.verts.new((fx - sa*lw*0.5, fy + ca*lw*0.5, cz - 0.008))
        v1 = bm_f.verts.new((fx + ca*lh,      fy + sa*lh,      cz + 0.012))
        v2 = bm_f.verts.new((fx + sa*lw*0.5, fy - ca*lw*0.5, cz - 0.008))
        v3 = bm_f.verts.new((fx - ca*lh*0.3, fy - sa*lh*0.3, cz - 0.015))
        bm_f.faces.new([v0, v1, v2, v3])
    bmesh.ops.solidify(bm_f, geom=bm_f.faces[:], thickness=0.0006)
    mesh_f = bpy.data.meshes.new("Arrangement_Foliage_Mesh")
    bm_f.to_mesh(mesh_f)
    bm_f.free()
    obj_f = bpy.data.objects.new("Arrangement_Foliage", mesh_f)
    bpy.context.collection.objects.link(obj_f)
    obj_f.parent = root
    obj_f.data.materials.append(mats['leaf'])
    for p in obj_f.data.polygons:
        p.use_smooth = True

# =============================================================================
# STUDIO LIGHTING & GALLERY CAMERAS
# =============================================================================
def setup_gallery_environment():
    world = bpy.context.scene.world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs['Color'].default_value = (0.97, 0.97, 0.98, 1.0)
        bg.inputs['Strength'].default_value = 1.0

    # Wide Overview Camera
    bpy.ops.object.camera_add(location=(1.25, -6.50, 2.20), rotation=(math.radians(75), 0, 0))
    cam_all = bpy.context.active_object
    cam_all.name = "Overview_Gallery_Cam"
    cam_all.data.lens = 35
    bpy.context.scene.camera = cam_all

    # Overhead Balanced Illumination
    for x_pos in [-3.5, 0.0, 3.5, 6.0]:
        bpy.ops.object.light_add(type='AREA', location=(x_pos, -1.0, 3.0), rotation=(math.radians(25), 0, 0))
        lit = bpy.context.active_object
        lit.name = f"Studio_Light_X_{x_pos}"
        lit.data.energy = 220
        lit.data.size = 2.0
        lit.data.color = (1.0, 0.97, 0.92)

# =============================================================================
# RUN SEPARATED SHOWROOM BUILD
# =============================================================================
def build_separated_showroom():
    clean_scene()
    mats = build_master_materials()

    # Station 1: Lounge Chair (-3.5m)
    build_station_chair(mats, origin_x=-3.500)

    # Station 2: Reception Desk (0.0m)
    build_station_reception_desk(mats, origin_x=0.000)

    # Station 3: iMac Setup (+3.5m)
    build_station_imac(mats, origin_x=3.500)

    # Station 4: Blissful Orange Flowers (+6.0m)
    build_station_flowers(mats, origin_x=6.000)

    setup_gallery_environment()
    print("Separated showroom generated successfully: Chair, Desk, iMac, and Flowers placed in individual stations.")

build_separated_showroom()