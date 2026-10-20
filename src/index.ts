import {
  engine,
  Transform,
  GltfContainer,
  ColliderLayer,
  TextShape,
  Billboard,
  BillboardMode,
  MeshRenderer,
  MeshCollider,
  Material,
  MaterialTransparencyMode,
  pointerEventsSystem,
  InputAction
} from '@dcl/sdk/ecs'
import { Vector3, Color4, Color3, Quaternion } from '@dcl/sdk/math'

export function main() {
  // 1. Villa Architectural Model (Centered at (32, 0, 16))
  const villa = engine.addEntity()
  GltfContainer.create(villa, {
    src: 'assets/models/villa.glb',
    visibleMeshesCollisionMask: ColliderLayer.CL_PHYSICS | ColliderLayer.CL_POINTER,
    invisibleMeshesCollisionMask: 0
  })
  Transform.create(villa, {
    position: Vector3.create(32, 0, 16)
  })

  // 2. Grand Entrance Floating Title Sign (Facing FRONT STEPS at Z = 23.9)
  const sign = engine.addEntity()
  Transform.create(sign, {
    position: Vector3.create(32, 6.4, 23.9)
  })
  TextShape.create(sign, {
    text: '✦ THE RESORT CLUB ✦\n[ AUTOMATIC SLIDING DOORS ]',
    fontSize: 2.2,
    textColor: Color4.create(1.0, 0.88, 0.55, 1)
  })
  Billboard.create(sign, {
    billboardMode: BillboardMode.BM_Y
  })

  // Directional Signs inside Reception Lounge
  const createHallSign = (pos: Vector3, label: string) => {
    const s = engine.addEntity()
    Transform.create(s, { position: pos })
    TextShape.create(s, {
      text: label,
      fontSize: 1.6,
      textColor: Color4.create(1.0, 0.85, 0.45, 1)
    })
    Billboard.create(s, { billboardMode: BillboardMode.BM_Y })
  }

  // Hallway signs positioned above 3.10m tall doorway portals
  createHallSign(Vector3.create(37.8, 5.85, 20.8), 'EAST WING ▶\n(SUITES 4, 5 & 6)')
  createHallSign(Vector3.create(26.2, 5.85, 20.8), '◀ WEST WING\n(SUITES 1 & 2)')
  createHallSign(Vector3.create(32.0, 6.20, 18.2), '▲ SKYBRIDGE PENTHOUSE ▲\n(SUITE 3 - GRAND STAIRS)')

  // 3. Sliding Doors Architecture (Facing FRONT STEPS at Z = 23.8)
  const DOOR_Z = 23.8
  const FLOOR_Y = 2.5
  const DOOR_HEIGHT = 3.10
  const DOOR_CENTER_Y = FLOOR_Y + DOOR_HEIGHT * 0.5 // 4.05
  const PANEL_WIDTH = 1.68
  const PANEL_THICKNESS = 0.08

  const LEFT_CLOSED_X = 32.0 - 0.82
  const LEFT_OPEN_X = 32.0 - 2.50
  const RIGHT_CLOSED_X = 32.0 + 0.82
  const RIGHT_OPEN_X = 32.0 + 2.50

  let isDoorOpen = false
  let currentLeftX = LEFT_CLOSED_X
  let currentRightX = RIGHT_CLOSED_X

  // Premium Architectural Smoked Glass
  const doorGlassMaterial = {
    albedoColor: Color4.create(0.12, 0.18, 0.24, 0.72),
    metallic: 0.35,
    roughness: 0.06,
    transparencyMode: MaterialTransparencyMode.MTM_ALPHA_BLEND,
    emissiveColor: Color3.create(0.04, 0.08, 0.12),
    emissiveIntensity: 0.2
  }

  // Brushed Bronze Accent Material
  const bronzeAccentMaterial = {
    albedoColor: Color4.create(0.82, 0.62, 0.26, 1),
    metallic: 0.95,
    roughness: 0.18
  }

  // Floor Guide Track (Flush on podium floor)
  const floorTrack = engine.addEntity()
  Transform.create(floorTrack, {
    position: Vector3.create(32.0, FLOOR_Y + 0.015, DOOR_Z),
    scale: Vector3.create(5.2, 0.03, 0.16)
  })
  MeshRenderer.setBox(floorTrack)
  Material.setPbrMaterial(floorTrack, bronzeAccentMaterial)

  // Top Header Guide Track (Beneath portal lintel)
  const topTrack = engine.addEntity()
  Transform.create(topTrack, {
    position: Vector3.create(32.0, FLOOR_Y + DOOR_HEIGHT + 0.02, DOOR_Z),
    scale: Vector3.create(5.2, 0.04, 0.16)
  })
  MeshRenderer.setBox(topTrack)
  Material.setPbrMaterial(topTrack, bronzeAccentMaterial)

  // Left Door Panel
  const leftDoor = engine.addEntity()
  Transform.create(leftDoor, {
    position: Vector3.create(currentLeftX, DOOR_CENTER_Y, DOOR_Z),
    scale: Vector3.create(PANEL_WIDTH, DOOR_HEIGHT, PANEL_THICKNESS)
  })
  MeshRenderer.setBox(leftDoor)
  MeshCollider.setBox(leftDoor)
  Material.setPbrMaterial(leftDoor, doorGlassMaterial)

  // Left Door Vertical Handle (facing front steps)
  const leftHandle = engine.addEntity()
  Transform.create(leftHandle, {
    position: Vector3.create(currentLeftX + 0.68, DOOR_CENTER_Y, DOOR_Z + 0.06),
    scale: Vector3.create(0.05, 1.2, 0.06)
  })
  MeshRenderer.setBox(leftHandle)
  Material.setPbrMaterial(leftHandle, bronzeAccentMaterial)

  // Right Door Panel
  const rightDoor = engine.addEntity()
  Transform.create(rightDoor, {
    position: Vector3.create(currentRightX, DOOR_CENTER_Y, DOOR_Z),
    scale: Vector3.create(PANEL_WIDTH, DOOR_HEIGHT, PANEL_THICKNESS)
  })
  MeshRenderer.setBox(rightDoor)
  MeshCollider.setBox(rightDoor)
  Material.setPbrMaterial(rightDoor, doorGlassMaterial)

  // Right Door Vertical Handle (facing front steps)
  const rightHandle = engine.addEntity()
  Transform.create(rightHandle, {
    position: Vector3.create(currentRightX - 0.68, DOOR_CENTER_Y, DOOR_Z + 0.06),
    scale: Vector3.create(0.05, 1.2, 0.06)
  })
  MeshRenderer.setBox(rightHandle)
  Material.setPbrMaterial(rightHandle, bronzeAccentMaterial)

  // Clickable Manual Toggle
  const toggleDoor = () => {
    isDoorOpen = !isDoorOpen
  }

  pointerEventsSystem.onPointerDown(
    {
      entity: leftDoor,
      opts: { button: InputAction.IA_POINTER, hoverText: 'Toggle Door' }
    },
    toggleDoor
  )

  pointerEventsSystem.onPointerDown(
    {
      entity: rightDoor,
      opts: { button: InputAction.IA_POINTER, hoverText: 'Toggle Door' }
    },
    toggleDoor
  )

  // 4. Smooth Automatic Proximity Sensor & Sliding System (Front Lawn Entrance)
  const SENSOR_OPEN_DIST = 5.2
  const SENSOR_CLOSE_DIST = 6.2
  const SLIDE_SPEED = 4.2

  engine.addSystem((dt: number) => {
    // Proximity check from player to entrance doorway
    const playerTransform = Transform.getOrNull(engine.PlayerEntity)
    if (playerTransform) {
      const p = playerTransform.position
      const dx = p.x - 32.0
      const dz = p.z - DOOR_Z
      const dist = Math.sqrt(dx * dx + dz * dz)

      // Automatic sensor opens when near, closes when walked away
      if (dist < SENSOR_OPEN_DIST) {
        isDoorOpen = true
      } else if (dist > SENSOR_CLOSE_DIST) {
        isDoorOpen = false
      }
    }

    const targetLeft = isDoorOpen ? LEFT_OPEN_X : LEFT_CLOSED_X
    const targetRight = isDoorOpen ? RIGHT_OPEN_X : RIGHT_CLOSED_X

    // Smooth lerp sliding motion
    const step = Math.min(dt * SLIDE_SPEED, 1.0)
    currentLeftX += (targetLeft - currentLeftX) * step
    currentRightX += (targetRight - currentRightX) * step

    // Update left door & handle
    const leftDoorTransform = Transform.getMutable(leftDoor)
    leftDoorTransform.position.x = currentLeftX

    const leftHandleTransform = Transform.getMutable(leftHandle)
    leftHandleTransform.position.x = currentLeftX + 0.68

    // Update right door & handle
    const rightDoorTransform = Transform.getMutable(rightDoor)
    rightDoorTransform.position.x = currentRightX

    const rightHandleTransform = Transform.getMutable(rightHandle)
    rightHandleTransform.position.x = currentRightX - 0.68
  })
}
