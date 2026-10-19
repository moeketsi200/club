import bpy
import bmesh
import math

# -------------------------------------------------------------------------
# 0. Clean Existing Scene
# -------------------------------------------------------------------------
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

for block in bpy.data.meshes:
    bpy.data.meshes.remove(block)
for block in bpy.data.materials:
    bpy.data.materials.remove(block)

# -------------------------------------------------------------------------
# 1. Architectural Materials
# -------------------------------------------------------------------------
def create_mat(name, color, metallic=0.0, roughness=0.3, transmission=0.0, ior=1.45, alpha=1.0, emission=(0,0,0,1), strength=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    
    bsdf.inputs['Base Color'].default_value = color
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = roughness
    
    if 'Alpha' in bsdf.inputs:
        bsdf.inputs['Alpha'].default_value = alpha
    if alpha < 1.0:
        mat.blend_method = 'BLEND'
        if hasattr(mat, 'shadow_method'):
            mat.shadow_method = 'NONE'

    if 'Transmission Weight' in bsdf.inputs:
        bsdf.inputs['Transmission Weight'].default_value = transmission
    elif 'Transmission' in bsdf.inputs:
        bsdf.inputs['Transmission'].default_value = transmission
        
    if 'IOR' in bsdf.inputs:
        bsdf.inputs['IOR'].default_value = ior

    if 'Emission Color' in bsdf.inputs:
        bsdf.inputs['Emission Color'].default_value = emission
        bsdf.inputs['Emission Strength'].default_value = strength
    elif 'Emission' in bsdf.inputs:
        bsdf.inputs['Emission'].default_value = emission

    return mat

mat_stone    = create_mat("Limestone_Facade", (0.88, 0.86, 0.82, 1), metallic=0.05, roughness=0.55)
mat_bronze   = create_mat("Bronze_Louvers_Frames", (0.42, 0.32, 0.20, 1), metallic=0.6, roughness=0.32)
mat_glass    = create_mat("Curtain_Wall_Glass", (0.35, 0.52, 0.65, 1), metallic=0.1, roughness=0.05, transmission=0.85, ior=1.52, alpha=0.35)
mat_room_lit = create_mat("Warm_Interior_Glow", (1.0, 0.85, 0.58, 1), emission=(1.0, 0.84, 0.55, 1), strength=5.5)
mat_door     = create_mat("Rich_Teak_Door", (0.22, 0.14, 0.09, 1), metallic=0.0, roughness=0.4)
mat_pool     = create_mat("Sky_Pool_Water", (0.02, 0.60, 0.75, 1), metallic=0.1, roughness=0.02, transmission=0.92, ior=1.333, alpha=0.55)
mat_marble   = create_mat("Penthouse_Travertine_Marble", (0.91, 0.89, 0.86, 1), metallic=0.06, roughness=0.22)
mat_wood     = create_mat("Architectural_Walnut", (0.28, 0.18, 0.12, 1), metallic=0.0, roughness=0.45)
mat_glow_gold = create_mat("Warm_LED_Glow", (1.0, 0.88, 0.65, 1), emission=(1.0, 0.86, 0.60, 1), strength=6.0)
mat_foliage  = create_mat("Lush_Tropical_Plant", (0.12, 0.35, 0.14, 1), metallic=0.0, roughness=0.6)

# -------------------------------------------------------------------------
# 2. Parametric S-Curve Coordinates
# -------------------------------------------------------------------------
def get_curve_coords(t):
    """t ranges from -1.0 (West/Left) to +1.0 (East/Right)"""
    x = t * 22.0
    y = math.sin(t * math.pi * 0.85) * 4.6 + (t * 1.2)
    dy_dx = (math.pi * 0.85 * 4.6 * math.cos(t * math.pi * 0.85) + 1.2) / 22.0
    rot_z = math.atan(dy_dx)
    return x, y, rot_z

# -------------------------------------------------------------------------
# 3. 6 Interlocking Suites Layout
# -------------------------------------------------------------------------
# (name, t_val, z_base, length, depth, height, shift_overhang_y, has_pool)
SIX_SUITES = [
    # West Wing Stack (Suites 1 & 2)
    ("Suite_01_West_Lower",  -0.62,  2.5, 12.0, 7.6, 3.8,  0.0, False),
    ("Suite_02_West_Upper",  -0.65,  6.6, 12.8, 8.2, 4.0,  1.6, True),   # Cantilevers forward with plunge pool

    # Center Suspended Sky-Bridge Suite over open breezeway void
    ("Suite_03_SkyBridge",    0.00,  7.0, 15.2, 7.8, 4.0,  0.4, True),   # Center bridge suite with infinity pool

    # East Wing Cascade Stack (Suites 4, 5 & 6)
    ("Suite_04_East_Lower",   0.56,  2.5, 11.8, 7.6, 3.8,  0.0, False),
    ("Suite_05_East_Mid",     0.60,  6.6, 12.4, 8.0, 4.0,  1.4, True),   # Middle stepped cantilever
    ("Suite_06_East_Upper",   0.58, 10.9, 11.2, 7.4, 3.8, -0.5, True),   # Top crown penthouse suite
]

# -------------------------------------------------------------------------
# 4. Build Fully Enclosed Suites with Windows, Louvers, and Doors
# -------------------------------------------------------------------------
for (s_name, t_val, z_base, s_len, s_depth, s_height, shift_y, has_pool) in SIX_SUITES:
    cx, cy, rot_z = get_curve_coords(t_val)
    if s_name == "Suite_03_SkyBridge":
        rot_z = 0.0
        cx = 0.0
        cy = 0.0

    nx = -math.sin(rot_z)
    ny =  math.cos(rot_z)
    
    bx = cx + nx * shift_y
    by = cy + ny * shift_y
    center_z = z_base + (s_height * 0.5)

    # 1. Solid Top & Bottom Slabs (Caps room completely, with open stairwell voids for Suite 3, 5, and 6)
    for z_off, slab_tag in [(0.15, "Floor"), (s_height, "Ceiling")]:
        if s_name == "Suite_03_SkyBridge" and slab_tag == "Floor":
            # Left floor section (spans X = -7.6 to -1.35, Y = -3.5 to +4.3)
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-4.475, by, z_base + z_off))
            sl_l = bpy.context.active_object
            sl_l.name = f"{s_name}_Floor_Left"
            sl_l.scale = (6.25, s_depth, 0.3)
            bpy.ops.object.transform_apply(scale=True)
            sl_l.data.materials.append(mat_marble)

            # Right floor section (spans X = +1.35 to +7.6, Y = -3.5 to +4.3)
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(4.475, by, z_base + z_off))
            sl_r = bpy.context.active_object
            sl_r.name = f"{s_name}_Floor_Right"
            sl_r.scale = (6.25, s_depth, 0.3)
            bpy.ops.object.transform_apply(scale=True)
            sl_r.data.materials.append(mat_marble)

            # Front catwalk bridge section (spans X = -1.35 to +1.35, Y = +0.60 to +4.3)
            f_depth = (s_depth * 0.5) + (by - 0.60) # 3.7m
            f_center_y = 0.60 + (f_depth * 0.5)      # 2.45m
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, f_center_y, z_base + z_off))
            sl_f = bpy.context.active_object
            sl_f.name = f"{s_name}_Floor_Front"
            sl_f.scale = (2.7, f_depth, 0.3)
            bpy.ops.object.transform_apply(scale=True)
            sl_f.data.materials.append(mat_marble)

            # Rear Landing section behind top of stairs (spans X = -1.35 to +1.35, Y = -3.5 to -3.10)
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, -3.30, z_base + z_off))
            sl_back = bpy.context.active_object
            sl_back.name = f"{s_name}_Floor_Rear_Landing"
            sl_back.scale = (2.7, 0.40, 0.3)
            bpy.ops.object.transform_apply(scale=True)
            sl_back.data.materials.append(mat_marble)
        elif s_name == "Suite_05_East_Mid" and slab_tag == "Floor":
            # East Mid Suite Floor: leaves open stair void for Flight 1 (X = 12.0 to 17.6, Y = 2.72 to 4.70)
            # Front Main Floor (Y = 4.70 to 10.72)
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(13.175, 7.71, z_base + z_off))
            sl_f5 = bpy.context.active_object
            sl_f5.name = f"{s_name}_Floor_Main"
            sl_f5.scale = (12.35, 6.02, 0.3)
            bpy.ops.object.transform_apply(scale=True)
            sl_f5.data.materials.append(mat_marble)

            # West Entry Threshold Floor (X = 7.0 to 12.0, Y = 2.72 to 4.70)
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(9.5, 3.71, z_base + z_off))
            sl_w5 = bpy.context.active_object
            sl_w5.name = f"{s_name}_Floor_Entry"
            sl_w5.scale = (5.0, 1.98, 0.3)
            bpy.ops.object.transform_apply(scale=True)
            sl_w5.data.materials.append(mat_marble)

            # East Stair Landing Floor (X = 17.6 to 19.35, Y = 2.72 to 4.70)
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(18.475, 3.71, z_base + z_off))
            sl_e5 = bpy.context.active_object
            sl_e5.name = f"{s_name}_Floor_EastLanding"
            sl_e5.scale = (1.75, 1.98, 0.3)
            bpy.ops.object.transform_apply(scale=True)
            sl_e5.data.materials.append(mat_marble)
        elif s_name == "Suite_06_East_Upper" and slab_tag == "Floor":
            # East Upper Suite Floor: leaves open stair void for Flight 2 (X = 12.0 to 18.39, Y = 4.70 to 6.10)
            # Front Floor (Y = 6.10 to 8.50)
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(12.79, 7.30, z_base + z_off))
            sl_f6 = bpy.context.active_object
            sl_f6.name = f"{s_name}_Floor_Main"
            sl_f6.scale = (11.20, 2.40, 0.3)
            bpy.ops.object.transform_apply(scale=True)
            sl_f6.data.materials.append(mat_marble)

            # West & Stair Arrival Floor (X = 7.19 to 12.0, Y = 1.10 to 6.10)
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(9.595, 3.60, z_base + z_off))
            sl_w6 = bpy.context.active_object
            sl_w6.name = f"{s_name}_Floor_Arrival"
            sl_w6.scale = (4.81, 5.0, 0.3)
            bpy.ops.object.transform_apply(scale=True)
            sl_w6.data.materials.append(mat_marble)

            # South-East Floor (X = 12.0 to 18.39, Y = 1.10 to 4.70)
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(15.195, 2.90, z_base + z_off))
            sl_e6 = bpy.context.active_object
            sl_e6.name = f"{s_name}_Floor_East"
            sl_e6.scale = (6.39, 3.60, 0.3)
            bpy.ops.object.transform_apply(scale=True)
            sl_e6.data.materials.append(mat_marble)
        elif s_name == "Suite_05_East_Mid" and slab_tag == "Ceiling":
            # Suite 5 Ceiling: leaves open stair void for Flight 2 matching Suite 6 floor void
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(12.79, 7.30, z_base + z_off))
            sl_c5a = bpy.context.active_object
            sl_c5a.name = f"{s_name}_Ceiling_Main"
            sl_c5a.scale = (11.20, 2.40, 0.3)
            bpy.ops.object.transform_apply(scale=True)
            sl_c5a.data.materials.append(mat_stone)

            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(9.595, 3.60, z_base + z_off))
            sl_c5b = bpy.context.active_object
            sl_c5b.name = f"{s_name}_Ceiling_West"
            sl_c5b.scale = (4.81, 5.0, 0.3)
            bpy.ops.object.transform_apply(scale=True)
            sl_c5b.data.materials.append(mat_stone)

            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(15.195, 2.90, z_base + z_off))
            sl_c5c = bpy.context.active_object
            sl_c5c.name = f"{s_name}_Ceiling_East"
            sl_c5c.scale = (6.39, 3.60, 0.3)
            bpy.ops.object.transform_apply(scale=True)
            sl_c5c.data.materials.append(mat_stone)
        elif s_name == "Suite_04_East_Lower" and slab_tag == "Ceiling":
            # Suite 4 Ceiling: leaves open stair void matching Suite 5 floor void
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(13.175, 7.71, z_base + z_off))
            sl_c4a = bpy.context.active_object
            sl_c4a.name = f"{s_name}_Ceiling_Main"
            sl_c4a.scale = (12.35, 6.02, 0.3)
            bpy.ops.object.transform_apply(scale=True)
            sl_c4a.data.materials.append(mat_stone)

            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(9.5, 3.71, z_base + z_off))
            sl_c4b = bpy.context.active_object
            sl_c4b.name = f"{s_name}_Ceiling_West"
            sl_c4b.scale = (5.0, 1.98, 0.3)
            bpy.ops.object.transform_apply(scale=True)
            sl_c4b.data.materials.append(mat_stone)

            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(18.475, 3.71, z_base + z_off))
            sl_c4c = bpy.context.active_object
            sl_c4c.name = f"{s_name}_Ceiling_EastLanding"
            sl_c4c.scale = (1.75, 1.98, 0.3)
            bpy.ops.object.transform_apply(scale=True)
            sl_c4c.data.materials.append(mat_stone)
        else:
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(bx, by, z_base + z_off))
            slab = bpy.context.active_object
            slab.name = f"{s_name}_{slab_tag}_Slab"
            slab.scale = (s_len, s_depth, 0.3)
            slab.rotation_euler = (0, 0, rot_z)
            bpy.ops.object.transform_apply(scale=True, rotation=True)
            slab.data.materials.append(mat_stone if slab_tag == "Ceiling" else mat_marble)

    # 2. Solid Rear Enclosure Wall (with opening for SkyBridge penthouse entrance from stairs)
    if s_name == "Suite_03_SkyBridge":
        wall_y = by - (s_depth * 0.47) # -3.27
        # Left wall
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-4.475, wall_y, center_z))
        bw_l = bpy.context.active_object
        bw_l.name = f"{s_name}_Rear_Wall_Left"
        bw_l.scale = (6.25, 0.35, s_height * 0.88)
        bpy.ops.object.transform_apply(scale=True)
        bw_l.data.materials.append(mat_stone)

        # Right wall
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(4.475, wall_y, center_z))
        bw_r = bpy.context.active_object
        bw_r.name = f"{s_name}_Rear_Wall_Right"
        bw_r.scale = (6.25, 0.35, s_height * 0.88)
        bpy.ops.object.transform_apply(scale=True)
        bw_r.data.materials.append(mat_stone)

        # Top Lintel above panoramic picture window
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, wall_y, z_base + 3.4))
        bw_top = bpy.context.active_object
        bw_top.name = f"{s_name}_Rear_Wall_Lintel"
        bw_top.scale = (2.7, 0.35, 0.6)
        bpy.ops.object.transform_apply(scale=True)
        bw_top.data.materials.append(mat_stone)

        # Architectural Panoramic Picture Window behind stair landing (frames the outdoor view elegantly)
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, wall_y, z_base + (3.1 * 0.5)))
        bw_glass = bpy.context.active_object
        bw_glass.name = f"{s_name}_Rear_Panoramic_Glass"
        bw_glass.scale = (2.65, 0.08, 3.1)
        bpy.ops.object.transform_apply(scale=True)
        bw_glass.data.materials.append(mat_glass)

        # Bronze sills (top and bottom)
        for s_z in [z_base + 0.08, z_base + 3.05]:
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, wall_y, s_z))
            bw_sill = bpy.context.active_object
            bw_sill.name = f"{s_name}_Rear_Window_Sill_{s_z}"
            bw_sill.scale = (2.7, 0.18, 0.12)
            bpy.ops.object.transform_apply(scale=True)
            bw_sill.data.materials.append(mat_bronze)

        # Bronze architectural vertical mullions dividing panoramic glass
        for m_x in [-0.90, 0.0, 0.90]:
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(m_x, wall_y, z_base + (3.1 * 0.5)))
            bw_mullion = bpy.context.active_object
            bw_mullion.name = f"{s_name}_Rear_Mullion_{m_x}"
            bw_mullion.scale = (0.08, 0.14, 3.1)
            bpy.ops.object.transform_apply(scale=True)
            bw_mullion.data.materials.append(mat_bronze)

        # Luxury architectural vertical bronze sconces flanking the window
        for sc_x in [-1.55, 1.55]:
            # Bronze body
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(sc_x, wall_y + 0.20, z_base + 2.0))
            sc = bpy.context.active_object
            sc.name = f"{s_name}_Wall_Sconce_Body_{sc_x}"
            sc.scale = (0.12, 0.08, 0.80)
            bpy.ops.object.transform_apply(scale=True)
            sc.data.materials.append(mat_bronze)
            # Glowing warm lens
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(sc_x, wall_y + 0.25, z_base + 2.0))
            sc_lens = bpy.context.active_object
            sc_lens.name = f"{s_name}_Wall_Sconce_Lens_{sc_x}"
            sc_lens.scale = (0.08, 0.04, 0.70)
            bpy.ops.object.transform_apply(scale=True)
            sc_lens.data.materials.append(mat_glow_gold)
    else:
        bpy.ops.mesh.primitive_cube_add(
            size=1.0,
            location=(bx - nx * (s_depth * 0.47), by - ny * (s_depth * 0.47), center_z)
        )
        back_wall = bpy.context.active_object
        back_wall.name = f"{s_name}_Rear_Wall"
        back_wall.scale = (s_len * 0.98, 0.35, s_height * 0.88)
        back_wall.rotation_euler = (0, 0, rot_z)
        bpy.ops.object.transform_apply(scale=True, rotation=True)
        back_wall.data.materials.append(mat_stone)

    # 3. Left & Right Side Core Walls with Walk-Through Door Portals
    for side in [-1, 1]:
        ex = bx + (side * (s_len * 0.5 - 0.35) * math.cos(rot_z))
        ey = by + (side * (s_len * 0.5 - 0.35) * math.sin(rot_z))
        
        # Door portal dimensions
        door_w = 1.40
        door_h = 2.60
        
        # Calculate precise aligned door position along the wall (s is signed distance along wall from center (ex, ey))
        if s_name == "Suite_03_SkyBridge":
            door_y_target = -1.60 if side == -1 else 3.40
            s_door = (door_y_target - ey) / ny
        elif s_name == "Suite_02_West_Upper" and side == 1:
            door_y_target = -1.60
            s_door = (door_y_target - ey) / ny
        elif s_name == "Suite_05_East_Mid" and side == -1:
            door_y_target = 3.40
            s_door = (door_y_target - ey) / ny
        else:
            s_door = -s_depth * 0.15

        d_x = ex + nx * s_door
        d_y = ey + ny * s_door

        # Rear wall segment (from rear corner to door opening)
        s_rear_min = -s_depth * 0.5
        s_rear_max = s_door - (door_w * 0.5)
        rear_depth = max(0.0, s_rear_max - s_rear_min)
        if rear_depth > 0.25:
            s_rear_mid = (s_rear_min + s_rear_max) * 0.5
            rx = ex + nx * s_rear_mid
            ry = ey + ny * s_rear_mid
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(rx, ry, center_z))
            w_rear = bpy.context.active_object
            w_rear.name = f"{s_name}_Side_{side}_Rear"
            w_rear.scale = (0.7, rear_depth, s_height * 0.88)
            w_rear.rotation_euler = (0, 0, rot_z)
            bpy.ops.object.transform_apply(scale=True, rotation=True)
            w_rear.data.materials.append(mat_stone)

        # Front wall segment (from door opening to front corner)
        s_front_min = s_door + (door_w * 0.5)
        s_front_max = s_depth * 0.5
        front_depth = max(0.0, s_front_max - s_front_min)
        if front_depth > 0.25:
            s_front_mid = (s_front_min + s_front_max) * 0.5
            fx = ex + nx * s_front_mid
            fy = ey + ny * s_front_mid
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(fx, fy, center_z))
            w_front = bpy.context.active_object
            w_front.name = f"{s_name}_Side_{side}_Front"
            w_front.scale = (0.7, front_depth, s_height * 0.88)
            w_front.rotation_euler = (0, 0, rot_z)
            bpy.ops.object.transform_apply(scale=True, rotation=True)
            w_front.data.materials.append(mat_stone)

        # Lintel wall above door portal
        lintel_h = (s_height * 0.92) - door_h
        if lintel_h > 0.2:
            lintel_z = z_base + door_h + (lintel_h * 0.5)
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(d_x, d_y, lintel_z))
            w_lintel = bpy.context.active_object
            w_lintel.name = f"{s_name}_Side_{side}_Lintel"
            w_lintel.scale = (0.7, door_w + 0.1, lintel_h)
            w_lintel.rotation_euler = (0, 0, rot_z)
            bpy.ops.object.transform_apply(scale=True, rotation=True)
            w_lintel.data.materials.append(mat_stone)

        # Open Architectural Bronze Portal Frame (Jambs and Top Lintel, completely open walk-through, no obstruction)
        # Top Header Lintel
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(d_x, d_y, z_base + door_h - 0.06))
        d_lintel = bpy.context.active_object
        d_lintel.name = f"{s_name}_DoorLintel_{side}"
        d_lintel.scale = (0.72, door_w + 0.05, 0.12)
        d_lintel.rotation_euler = (0, 0, rot_z)
        bpy.ops.object.transform_apply(scale=True, rotation=True)
        d_lintel.data.materials.append(mat_bronze)

        # Left & Right Bronze Jambs
        for j_dir in [-1, 1]:
            j_x = d_x + (nx * j_dir * (door_w * 0.5 - 0.05))
            j_y = d_y + (ny * j_dir * (door_w * 0.5 - 0.05))
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(j_x, j_y, z_base + (door_h * 0.5)))
            d_jamb = bpy.context.active_object
            d_jamb.name = f"{s_name}_DoorJamb_{side}_{j_dir}"
            d_jamb.scale = (0.72, 0.10, door_h)
            d_jamb.rotation_euler = (0, 0, rot_z)
            bpy.ops.object.transform_apply(scale=True, rotation=True)
            d_jamb.data.materials.append(mat_bronze)


    # 4. Front Glazing with Open Sliding Door onto Terrace / Pool
    front_door_w = 2.4
    panel_len = (s_len * 0.92 - front_door_w) * 0.5
    for p_side, p_dir in [("Left", -1), ("Right", 1)]:
        offset_len = p_dir * ((panel_len * 0.5) + (front_door_w * 0.5))
        px = bx + (offset_len * math.cos(rot_z)) + nx * (s_depth * 0.44)
        py = by + (offset_len * math.sin(rot_z)) + ny * (s_depth * 0.44)
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(px, py, center_z))
        front_glass = bpy.context.active_object
        front_glass.name = f"{s_name}_Front_Glass_{p_side}"
        front_glass.scale = (panel_len, 0.08, s_height * 0.84)
        front_glass.rotation_euler = (0, 0, rot_z)
        bpy.ops.object.transform_apply(scale=True, rotation=True)
        front_glass.data.materials.append(mat_room_lit)

    # 5. Vertical Architectural Louvers on Facade
    num_louvers = int(s_len / 1.2)
    for l_idx in range(-num_louvers // 2, (num_louvers // 2) + 1):
        offset = l_idx * 1.2
        lx = bx + (offset * math.cos(rot_z)) + nx * (s_depth * 0.49)
        ly = by + (offset * math.sin(rot_z)) + ny * (s_depth * 0.49)
        
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(lx, ly, center_z))
        louver = bpy.context.active_object
        louver.name = f"{s_name}_Louver_{l_idx}"
        louver.scale = (0.06, 0.15, s_height * 0.88)
        louver.rotation_euler = (0, 0, rot_z)
        bpy.ops.object.transform_apply(scale=True, rotation=True)
        louver.data.materials.append(mat_bronze)

    # 6. Cantilever Sky Terrace Pool & Glass Railing
    if has_pool:
        roof_z = z_base + s_height
        px = bx + nx * (s_depth * 0.22)
        py = by + ny * (s_depth * 0.22)
        
        # Plunge Pool
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(px, py, roof_z + 0.12))
        pool = bpy.context.active_object
        pool.name = f"{s_name}_PlungePool"
        pool.scale = (s_len * 0.42, s_depth * 0.38, 0.18)
        pool.rotation_euler = (0, 0, rot_z)
        bpy.ops.object.transform_apply(scale=True, rotation=True)
        pool.data.materials.append(mat_pool)

        # Glass Balustrade on Pool Deck
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(px + nx * (s_depth * 0.19), py + ny * (s_depth * 0.19), roof_z + 0.55))
        railing = bpy.context.active_object
        railing.name = f"{s_name}_Pool_Railing"
        railing.scale = (s_len * 0.42, 0.05, 0.9)
        railing.rotation_euler = (0, 0, rot_z)
        bpy.ops.object.transform_apply(scale=True, rotation=True)
        railing.data.materials.append(mat_glass)

# -------------------------------------------------------------------------
# 5. Inter-Suite Connecting Corridors & Circulation Shafts
# -------------------------------------------------------------------------
# West Vertical Core (Direct enclosed internal connection between Suite 1 and 2)
w_cx, w_cy, w_rot = get_curve_coords(-0.65)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(w_cx - 2.8, w_cy - 2.6, 6.2))
w_tower = bpy.context.active_object
w_tower.name = "Vertical_Core_West"
w_tower.scale = (3.2, 3.4, 9.8)
w_tower.rotation_euler = (0, 0, w_rot)
bpy.ops.object.transform_apply(scale=True, rotation=True)
w_tower.data.materials.append(mat_stone)

# East Vertical Core (Architectural fluted limestone & bronze feature column, non-obstructive)
e_cx, e_cy, e_rot = get_curve_coords(0.58)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(15.56, 2.30, 8.2))
e_tower = bpy.context.active_object
e_tower.name = "Vertical_Core_East"
e_tower.scale = (1.8, 1.2, 13.5)
e_tower.rotation_euler = (0, 0, e_rot)
bpy.ops.object.transform_apply(scale=True, rotation=True)
e_tower.data.materials.append(mat_stone)

# Fluted vertical bronze accents on East Core
for off_x in [-0.75, 0.75]:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(15.56 + off_x, 2.30, 8.2))
    e_flute = bpy.context.active_object
    e_flute.name = f"Vertical_Core_East_Flute_{off_x}"
    e_flute.scale = (0.12, 1.25, 13.5)
    bpy.ops.object.transform_apply(scale=True)
    e_flute.data.materials.append(mat_bronze)


# -------------------------------------------------------------------------
# 5A. Enclosed Glazed Sky Corridors (Walkable panoramic glass bridges connecting Suite 3 to wings)
# -------------------------------------------------------------------------
# A. West Sky Corridor (Connecting Suite 3 West Portal at X = -7.25, Y = -1.60 to Suite 2 East Portal at X = -8.11)
w_cx = -7.68
w_cy = -1.60
w_len = 1.60
w_w = 2.00
w_fl_z = 7.15
w_rf_z = 9.95
w_h = w_rf_z - w_fl_z - 0.25 # 2.55m clear height

# Walkable Travertine Marble Floor Slab
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(w_cx, w_cy, w_fl_z))
w_fl = bpy.context.active_object
w_fl.name = "Enclosed_Sky_Corridor_West_Floor"
w_fl.scale = (w_len, w_w, 0.30)
bpy.ops.object.transform_apply(scale=True)
w_fl.data.materials.append(mat_marble)

# Solid Architectural Roof Slab
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(w_cx, w_cy, w_rf_z))
w_rf = bpy.context.active_object
w_rf.name = "Enclosed_Sky_Corridor_West_Roof"
w_rf.scale = (w_len + 0.10, w_w + 0.10, 0.25)
bpy.ops.object.transform_apply(scale=True)
w_rf.data.materials.append(mat_stone)

# North & South Panoramic Glass Walls (Floor-to-ceiling transparent curtain walls)
for y_side, side_tag in [(-1, "South"), (1, "North")]:
    wall_y = w_cy + (y_side * (w_w * 0.5 - 0.03))
    
    # Transparent Curtain Wall Glass
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(w_cx, wall_y, w_fl_z + 0.15 + (w_h * 0.5)))
    w_glass = bpy.context.active_object
    w_glass.name = f"Enclosed_Sky_Corridor_West_{side_tag}_Glass" if side_tag == "South" else "Enclosed_Sky_Corridor_West"
    w_glass.scale = (w_len, 0.05, w_h)
    bpy.ops.object.transform_apply(scale=True)
    w_glass.data.materials.append(mat_glass)

    # Bronze Base Sill & Top Transom
    for s_z in [w_fl_z + 0.15 + 0.04, w_fl_z + 0.15 + w_h - 0.04]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(w_cx, wall_y, s_z))
        w_sill = bpy.context.active_object
        w_sill.name = f"Enclosed_Sky_Corridor_West_{side_tag}_Sill_{s_z:.1f}"
        w_sill.scale = (w_len + 0.05, 0.10, 0.08)
        bpy.ops.object.transform_apply(scale=True)
        w_sill.data.materials.append(mat_bronze)

    # Vertical Bronze Mullions
    for mx in [w_cx - 0.45, w_cx + 0.45]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(mx, wall_y, w_fl_z + 0.15 + (w_h * 0.5)))
        w_mul = bpy.context.active_object
        w_mul.name = f"Enclosed_Sky_Corridor_West_{side_tag}_Mullion_{mx:.1f}"
        w_mul.scale = (0.08, 0.12, w_h)
        bpy.ops.object.transform_apply(scale=True)
        w_mul.data.materials.append(mat_bronze)

# Ceiling Warm LED Linear Light
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(w_cx, w_cy, w_rf_z - 0.14))
w_light = bpy.context.active_object
w_light.name = "Enclosed_Sky_Corridor_West_Light"
w_light.scale = (w_len * 0.85, 0.08, 0.02)
bpy.ops.object.transform_apply(scale=True)
w_light.data.materials.append(mat_glow_gold)


# B. East Sky Corridor (Connecting Suite 3 East Portal at X = 7.25, Y = 3.40 to Suite 5 West Portal at X = 7.42)
e_cx = 7.33
e_cy = 3.40
e_len = 1.60
e_w = 2.00

# Walkable Travertine Marble Floor Slab (Smooth transition between Suite 3 at Z=7.15 and Suite 5 at Z=6.75)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(e_cx, e_cy, 6.95))
e_fl = bpy.context.active_object
e_fl.name = "Enclosed_Sky_Corridor_East_Floor"
e_fl.scale = (e_len, e_w, 0.45)
bpy.ops.object.transform_apply(scale=True)
e_fl.data.materials.append(mat_marble)

# Solid Architectural Roof Slab
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(e_cx, e_cy, w_rf_z))
e_rf = bpy.context.active_object
e_rf.name = "Enclosed_Sky_Corridor_East_Roof"
e_rf.scale = (e_len + 0.10, e_w + 0.10, 0.25)
bpy.ops.object.transform_apply(scale=True)
e_rf.data.materials.append(mat_stone)

# North & South Panoramic Glass Walls
for y_side, side_tag in [(-1, "South"), (1, "North")]:
    wall_y = e_cy + (y_side * (e_w * 0.5 - 0.03))
    
    # Transparent Curtain Wall Glass
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(e_cx, wall_y, w_fl_z + 0.15 + (w_h * 0.5)))
    e_glass = bpy.context.active_object
    e_glass.name = f"Enclosed_Sky_Corridor_East_{side_tag}_Glass" if side_tag == "South" else "Enclosed_Sky_Corridor_East"
    e_glass.scale = (e_len, 0.05, w_h)
    bpy.ops.object.transform_apply(scale=True)
    e_glass.data.materials.append(mat_glass)

    # Bronze Base Sill & Top Transom
    for s_z in [w_fl_z + 0.15 + 0.04, w_fl_z + 0.15 + w_h - 0.04]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(e_cx, wall_y, s_z))
        e_sill = bpy.context.active_object
        e_sill.name = f"Enclosed_Sky_Corridor_East_{side_tag}_Sill_{s_z:.1f}"
        e_sill.scale = (e_len + 0.05, 0.10, 0.08)
        bpy.ops.object.transform_apply(scale=True)
        e_sill.data.materials.append(mat_bronze)

    # Vertical Bronze Mullions
    for mx in [e_cx - 0.45, e_cx + 0.45]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(mx, wall_y, w_fl_z + 0.15 + (w_h * 0.5)))
        e_mul = bpy.context.active_object
        e_mul.name = f"Enclosed_Sky_Corridor_East_{side_tag}_Mullion_{mx:.1f}"
        e_mul.scale = (0.08, 0.12, w_h)
        bpy.ops.object.transform_apply(scale=True)
        e_mul.data.materials.append(mat_bronze)

# Ceiling Warm LED Linear Light
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(e_cx, e_cy, w_rf_z - 0.14))
e_light = bpy.context.active_object
e_light.name = "Enclosed_Sky_Corridor_East_Light"
e_light.scale = (e_len * 0.85, 0.08, 0.02)
bpy.ops.object.transform_apply(scale=True)
e_light.data.materials.append(mat_glow_gold)


# -------------------------------------------------------------------------
# 5B. East Wing Multi-Level Architectural Circulation (Connecting Suites 4, 5, and 6)
# -------------------------------------------------------------------------
# Flight 1: Ascends eastward along Y = 4.0 from Suite 4 (Z = 2.50) to Suite 5 (Z = 6.60)
f1_x_start, f1_z_start = 12.20, 2.50
f1_x_end, f1_z_end = 17.80, 6.60
f1_y = 4.00
f1_w = 1.20
f1_rw = f1_w * 0.5
f1_steps = 18
f1_len = math.hypot(f1_x_end - f1_x_start, f1_z_end - f1_z_start)
f1_slope = math.atan2(f1_z_end - f1_z_start, f1_x_end - f1_x_start)

# Solid walkable ramp prism for Flight 1 (smooth collision)
r1_mesh = bpy.data.meshes.new("EastWing_Stair_Flight1_RampPrism")
r1_bm = bmesh.new()
v1_1 = r1_bm.verts.new((f1_x_start, f1_y - f1_rw, f1_z_start))
v1_2 = r1_bm.verts.new((f1_x_start, f1_y + f1_rw, f1_z_start))
v1_3 = r1_bm.verts.new((f1_x_end,   f1_y + f1_rw, f1_z_end))
v1_4 = r1_bm.verts.new((f1_x_end,   f1_y - f1_rw, f1_z_end))
v1_5 = r1_bm.verts.new((f1_x_start, f1_y - f1_rw, f1_z_start - 0.25))
v1_6 = r1_bm.verts.new((f1_x_start, f1_y + f1_rw, f1_z_start - 0.25))
v1_7 = r1_bm.verts.new((f1_x_end,   f1_y + f1_rw, f1_z_end - 0.25))
v1_8 = r1_bm.verts.new((f1_x_end,   f1_y - f1_rw, f1_z_end - 0.25))

r1_bm.faces.new((v1_1, v1_2, v1_3, v1_4)) # top walkable ramp surface
r1_bm.faces.new((v1_8, v1_7, v1_6, v1_5)) # bottom surface
r1_bm.faces.new((v1_1, v1_5, v1_6, v1_2)) # start end
r1_bm.faces.new((v1_3, v1_7, v1_8, v1_4)) # top end
r1_bm.faces.new((v1_1, v1_4, v1_8, v1_5)) # south side
r1_bm.faces.new((v1_2, v1_6, v1_7, v1_3)) # north side
r1_bm.to_mesh(r1_mesh)
r1_bm.free()

r1_obj = bpy.data.objects.new("EastWing_Stair_Flight1_SolidRamp", r1_mesh)
bpy.context.collection.objects.link(r1_obj)
r1_obj.data.materials.append(mat_marble)

# Stepped Travertine Treads with Under-Tread Warm LED Lights for Flight 1
for s in range(f1_steps):
    step_t = (s + 0.5) / f1_steps
    sx = f1_x_start + step_t * (f1_x_end - f1_x_start)
    sz = f1_z_start + step_t * (f1_z_end - f1_z_start)
    
    # Tread
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(sx, f1_y, sz + 0.05))
    step = bpy.context.active_object
    step.name = f"EastWing_F1_Step_{s}"
    step.scale = ((f1_x_end - f1_x_start) / f1_steps * 1.15, f1_w, 0.12)
    bpy.ops.object.transform_apply(scale=True)
    step.data.materials.append(mat_marble)

    # LED strip under tread
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(sx, f1_y, sz - 0.02))
    s_light = bpy.context.active_object
    s_light.name = f"EastWing_F1_StepLight_{s}"
    s_light.scale = ((f1_x_end - f1_x_start) / f1_steps * 0.85, f1_w * 0.90, 0.02)
    bpy.ops.object.transform_apply(scale=True)
    s_light.data.materials.append(mat_glow_gold)

# Glass Balustrades & Bronze Handrails for Flight 1
f1_mid_x = (f1_x_start + f1_x_end) * 0.5
f1_mid_z = (f1_z_start + f1_z_end) * 0.5
for y_side, side_tag in [(-1, "South"), (1, "North")]:
    rail_y = f1_y + (y_side * (f1_rw + 0.02))
    
    # Sloped Glass Balustrade
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(f1_mid_x, rail_y, f1_mid_z + 0.55))
    f1_glass = bpy.context.active_object
    f1_glass.name = f"EastWing_F1_Glass_{side_tag}"
    f1_glass.scale = (f1_len, 0.04, 0.90)
    f1_glass.rotation_euler = (0, -f1_slope, 0)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    f1_glass.data.materials.append(mat_glass)

    # Sloped Bronze Handrail
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(f1_mid_x, rail_y, f1_mid_z + 1.02))
    f1_rail = bpy.context.active_object
    f1_rail.name = f"EastWing_F1_Handrail_{side_tag}"
    f1_rail.scale = (f1_len + 0.05, 0.07, 0.05)
    f1_rail.rotation_euler = (0, -f1_slope, 0)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    f1_rail.data.materials.append(mat_bronze)


# Flight 2: Ascends westward along Y = 5.4 from Suite 5 landing (Z = 6.60) to Suite 6 Penthouse (Z = 10.90)
f2_x_start, f2_z_start = 17.80, 6.60
f2_x_end, f2_z_end = 12.20, 10.90
f2_y = 5.40
f2_w = 1.20
f2_rw = f2_w * 0.5
f2_steps = 18
f2_len = math.hypot(f2_x_end - f2_x_start, f2_z_end - f2_z_start)
f2_slope = math.atan2(f2_z_end - f2_z_start, f2_x_start - f2_x_end) # positive angle for -X ascent

# Solid walkable ramp prism for Flight 2
r2_mesh = bpy.data.meshes.new("EastWing_Stair_Flight2_RampPrism")
r2_bm = bmesh.new()
v2_1 = r2_bm.verts.new((f2_x_start, f2_y - f2_rw, f2_z_start))
v2_2 = r2_bm.verts.new((f2_x_start, f2_y + f2_rw, f2_z_start))
v2_3 = r2_bm.verts.new((f2_x_end,   f2_y + f2_rw, f2_z_end))
v2_4 = r2_bm.verts.new((f2_x_end,   f2_y - f2_rw, f2_z_end))
v2_5 = r2_bm.verts.new((f2_x_start, f2_y - f2_rw, f2_z_start - 0.25))
v2_6 = r2_bm.verts.new((f2_x_start, f2_y + f2_rw, f2_z_start - 0.25))
v2_7 = r2_bm.verts.new((f2_x_end,   f2_y + f2_rw, f2_z_end - 0.25))
v2_8 = r2_bm.verts.new((f2_x_end,   f2_y - f2_rw, f2_z_end - 0.25))

r2_bm.faces.new((v2_1, v2_2, v2_3, v2_4))
r2_bm.faces.new((v2_8, v2_7, v2_6, v2_5))
r2_bm.faces.new((v2_1, v2_5, v2_6, v2_2))
r2_bm.faces.new((v2_3, v2_7, v2_8, v2_4))
r2_bm.faces.new((v2_1, v2_4, v2_8, v2_5))
r2_bm.faces.new((v2_2, v2_6, v2_7, v2_3))
r2_bm.to_mesh(r2_mesh)
r2_bm.free()

r2_obj = bpy.data.objects.new("EastWing_Stair_Flight2_SolidRamp", r2_mesh)
bpy.context.collection.objects.link(r2_obj)
r2_obj.data.materials.append(mat_marble)

# Stepped Travertine Treads with Under-Tread Warm LED Lights for Flight 2
for s in range(f2_steps):
    step_t = (s + 0.5) / f2_steps
    sx = f2_x_start + step_t * (f2_x_end - f2_x_start)
    sz = f2_z_start + step_t * (f2_z_end - f2_z_start)
    
    # Tread
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(sx, f2_y, sz + 0.05))
    step = bpy.context.active_object
    step.name = f"EastWing_F2_Step_{s}"
    step.scale = (abs(f2_x_end - f2_x_start) / f2_steps * 1.15, f2_w, 0.12)
    bpy.ops.object.transform_apply(scale=True)
    step.data.materials.append(mat_marble)

    # LED strip under tread
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(sx, f2_y, sz - 0.02))
    s_light = bpy.context.active_object
    s_light.name = f"EastWing_F2_StepLight_{s}"
    s_light.scale = (abs(f2_x_end - f2_x_start) / f2_steps * 0.85, f2_w * 0.90, 0.02)
    bpy.ops.object.transform_apply(scale=True)
    s_light.data.materials.append(mat_glow_gold)

# Glass Balustrades & Bronze Handrails for Flight 2
f2_mid_x = (f2_x_start + f2_x_end) * 0.5
f2_mid_z = (f2_z_start + f2_z_end) * 0.5
for y_side, side_tag in [(-1, "South"), (1, "North")]:
    rail_y = f2_y + (y_side * (f2_rw + 0.02))
    
    # Sloped Glass Balustrade
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(f2_mid_x, rail_y, f2_mid_z + 0.55))
    f2_glass = bpy.context.active_object
    f2_glass.name = f"EastWing_F2_Glass_{side_tag}"
    f2_glass.scale = (f2_len, 0.04, 0.90)
    f2_glass.rotation_euler = (0, f2_slope, 0)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    f2_glass.data.materials.append(mat_glass)

    # Sloped Bronze Handrail
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(f2_mid_x, rail_y, f2_mid_z + 1.02))
    f2_rail = bpy.context.active_object
    f2_rail.name = f"EastWing_F2_Handrail_{side_tag}"
    f2_rail.scale = (f2_len + 0.05, 0.07, 0.05)
    f2_rail.rotation_euler = (0, f2_slope, 0)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    f2_rail.data.materials.append(mat_bronze)

# Intermediate Walkable Landing in Suite 5 connecting Flight 1 top to Flight 2 bottom (Z = 6.60 + 0.15 = 6.75)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(18.25, 4.70, 6.75))
land_e5 = bpy.context.active_object
land_e5.name = "EastWing_Suite5_StairLanding_Bridge"
land_e5.scale = (1.50, 2.80, 0.30)
bpy.ops.object.transform_apply(scale=True)
land_e5.data.materials.append(mat_marble)

# Mezzanine Glass Balustrade on Suite 5 floor along north edge of Flight 1 void (along Y = 4.70 from X = 12.0 to 17.5)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(14.75, 4.70, 6.75 + 0.55))
m5_glass = bpy.context.active_object
m5_glass.name = "EastWing_Suite5_Mezzanine_Glass"
m5_glass.scale = (5.50, 0.04, 0.90)
bpy.ops.object.transform_apply(scale=True)
m5_glass.data.materials.append(mat_glass)

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(14.75, 4.70, 6.75 + 1.02))
m5_rail = bpy.context.active_object
m5_rail.name = "EastWing_Suite5_Mezzanine_Handrail"
m5_rail.scale = (5.55, 0.07, 0.05)
bpy.ops.object.transform_apply(scale=True)
m5_rail.data.materials.append(mat_bronze)

# Mezzanine Glass Balustrade on Suite 6 floor along south edge of Flight 2 void (along Y = 4.70 from X = 12.0 to 17.5)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(14.75, 4.70, 11.05 + 0.55))
m6_glass = bpy.context.active_object
m6_glass.name = "EastWing_Suite6_Mezzanine_Glass"
m6_glass.scale = (5.50, 0.04, 0.90)
bpy.ops.object.transform_apply(scale=True)
m6_glass.data.materials.append(mat_glass)

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(14.75, 4.70, 11.05 + 1.02))
m6_rail = bpy.context.active_object
m6_rail.name = "EastWing_Suite6_Mezzanine_Handrail"
m6_rail.scale = (5.55, 0.07, 0.05)
bpy.ops.object.transform_apply(scale=True)
m6_rail.data.materials.append(mat_bronze)


# -------------------------------------------------------------------------
# 6. Proportional Stepped Podium Base & Glazed Lobby
# -------------------------------------------------------------------------
for p_idx, p_h in enumerate([0.9, 1.8, 2.5]):
    p_mesh = bpy.data.meshes.new(f"Podium_{p_idx}")
    pbm = bmesh.new()
    steps = 32
    p_w = 0.95 - (p_idx * 0.03)
    p_depth = 18.0 - (p_idx * 2.6)
    
    verts = []
    for s in range(steps + 1):
        t = -p_w + (s / steps) * (2.0 * p_w)
        cx, cy, rot_z = get_curve_coords(t)
        nx = -math.sin(rot_z)
        ny =  math.cos(rot_z)
        verts.append((
            cx + nx * (p_depth * 0.5), cy + ny * (p_depth * 0.5),
            cx - nx * (p_depth * 0.5), cy - ny * (p_depth * 0.5)
        ))
        
    for idx in range(len(verts) - 1):
        f1_x, f1_y, b1_x, b1_y = verts[idx]
        f2_x, f2_y, b2_x, b2_y = verts[idx + 1]
        
        v1 = pbm.verts.new((f1_x, f1_y, 0))
        v2 = pbm.verts.new((f2_x, f2_y, 0))
        v3 = pbm.verts.new((b2_x, b2_y, 0))
        v4 = pbm.verts.new((b1_x, b1_y, 0))
        
        v5 = pbm.verts.new((f1_x, f1_y, p_h))
        v6 = pbm.verts.new((f2_x, f2_y, p_h))
        v7 = pbm.verts.new((b2_x, b2_y, p_h))
        v8 = pbm.verts.new((b1_x, b1_y, p_h))
        
        pbm.faces.new([v5, v6, v7, v8])
        pbm.faces.new([v1, v2, v6, v5])
        pbm.faces.new([v3, v4, v8, v7])
        
    pbm.to_mesh(p_mesh)
    pbm.free()
    p_obj = bpy.data.objects.new(f"Podium_Step_{p_idx}", p_mesh)
    bpy.context.scene.collection.objects.link(p_obj)
    p_obj.data.materials.append(mat_stone)

# Ground Floor Grand Reception Pavilion & Portal (Facing FRONT +Y with Suites & Pools)
# 1. Floor & Roof Slabs (Centered under SkyBridge, extending forward onto front lawn)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 5.0, 2.4))
lobby_floor = bpy.context.active_object
lobby_floor.name = "Reception_Floor_Slab"
lobby_floor.scale = (12.2, 6.2, 0.25)
bpy.ops.object.transform_apply(scale=True)
lobby_floor.data.materials.append(mat_stone)

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 5.0, 6.2))
lobby_roof = bpy.context.active_object
lobby_roof.name = "Reception_Roof_Slab"
lobby_roof.scale = (12.6, 6.6, 0.35)
bpy.ops.object.transform_apply(scale=True)
lobby_roof.data.materials.append(mat_stone)

# 2. Rear Enclosure Wall with Wide Open Grand Staircase Portal (No door blocking stairs)
# Left section of rear wall (from X = -5.8 to -1.35)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-3.6, 2.0, 4.3))
lobby_back_l = bpy.context.active_object
lobby_back_l.name = "Reception_Rear_Left"
lobby_back_l.scale = (4.4, 0.4, 3.6)
bpy.ops.object.transform_apply(scale=True)
lobby_back_l.data.materials.append(mat_stone)

# Right section of rear wall (from X = +1.35 to +5.8)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(3.6, 2.0, 4.3))
lobby_back_r = bpy.context.active_object
lobby_back_r.name = "Reception_Rear_Right"
lobby_back_r.scale = (4.4, 0.4, 3.6)
bpy.ops.object.transform_apply(scale=True)
lobby_back_r.data.materials.append(mat_stone)

# Top Lintel above Grand Stair Portal (clear height 3.2m, bottom of lintel at Z=5.7)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 2.0, 5.85))
lobby_back_lintel = bpy.context.active_object
lobby_back_lintel.name = "Reception_Rear_Lintel"
lobby_back_lintel.scale = (2.8, 0.4, 0.5)
bpy.ops.object.transform_apply(scale=True)
lobby_back_lintel.data.materials.append(mat_stone)

# Architectural Bronze Trim along Portal Opening (left and right jambs)
for side_x in [-1.35, 1.35]:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(side_x, 2.0, 4.1))
    portal_trim = bpy.context.active_object
    portal_trim.name = f"Reception_Rear_Portal_Trim_{side_x}"
    portal_trim.scale = (0.1, 0.42, 3.2)
    bpy.ops.object.transform_apply(scale=True)
    portal_trim.data.materials.append(mat_bronze)

# Side Walls (West and East) with Open Portals to Suites
for side_x, side_tag, side_dir in [(-5.8, "West", -1), (5.8, "East", 1)]:
    # Front section of side wall
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(side_x, 6.6, 4.3))
    w_front = bpy.context.active_object
    w_front.name = f"Reception_Side_{side_tag}_Front"
    w_front.scale = (0.4, 2.2, 3.6)
    bpy.ops.object.transform_apply(scale=True)
    w_front.data.materials.append(mat_stone)

    # Rear section of side wall
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(side_x, 3.2, 4.3))
    w_rear = bpy.context.active_object
    w_rear.name = f"Reception_Side_{side_tag}_Rear"
    w_rear.scale = (0.4, 2.0, 3.6)
    bpy.ops.object.transform_apply(scale=True)
    w_rear.data.materials.append(mat_stone)

    # Open Bronze Portal Frame to Wing (Lintel and Jambs, fully open to walk through)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(side_x, 4.8, 5.5))
    w_lintel = bpy.context.active_object
    w_lintel.name = f"Reception_DoorLintel_To_{side_tag}_Wing"
    w_lintel.scale = (0.45, 1.8, 0.2)
    bpy.ops.object.transform_apply(scale=True)
    w_lintel.data.materials.append(mat_bronze)

    for y_jamb in [3.95, 5.65]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(side_x, y_jamb, 3.9))
        w_jamb = bpy.context.active_object
        w_jamb.name = f"Reception_DoorJamb_To_{side_tag}_Wing_{y_jamb}"
        w_jamb.scale = (0.45, 0.12, 3.0)
        bpy.ops.object.transform_apply(scale=True)
        w_jamb.data.materials.append(mat_bronze)

    # Connecting Glazed Hallway into Wing (Floor, Ceiling, Glass Sides)
    corr_center_x = side_x + (side_dir * 1.6)
    # Floor
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(corr_center_x, 4.8, 2.45))
    c_fl = bpy.context.active_object
    c_fl.name = f"Corridor_Floor_{side_tag}"
    c_fl.scale = (3.2, 2.2, 0.2)
    bpy.ops.object.transform_apply(scale=True)
    c_fl.data.materials.append(mat_stone)

    # Roof
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(corr_center_x, 4.8, 5.6))
    c_rf = bpy.context.active_object
    c_rf.name = f"Corridor_Roof_{side_tag}"
    c_rf.scale = (3.2, 2.2, 0.2)
    bpy.ops.object.transform_apply(scale=True)
    c_rf.data.materials.append(mat_stone)

    # Glass Walls
    for y_off in [3.8, 5.8]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(corr_center_x, y_off, 4.0))
        c_gw = bpy.context.active_object
        c_gw.name = f"Corridor_Glass_{side_tag}_{y_off}"
        c_gw.scale = (3.0, 0.08, 2.9)
        bpy.ops.object.transform_apply(scale=True)
        c_gw.data.materials.append(mat_glass)

# Grand Architectural Staircase to Center SkyBridge Suite 3 (Ascending gently from Z=2.5 to Z=7.0)
stair_start_y = 2.5
stair_end_y = -3.5
stair_start_z = 2.5
stair_end_z = 7.0

stair_slope_angle = -math.atan(4.5 / 6.0) # -36.87 degrees, comfortable walkable slope
stair_length = math.hypot(-6.0, 4.5)     # 7.50m
stair_mid_y = (stair_start_y + stair_end_y) * 0.5  # -0.50
stair_mid_z = (stair_start_z + stair_end_z) * 0.5  # 4.75

# 1. Seamless Walkable Ramp Prism (Flush with reception floor at Y=2.5, Z=2.5, zero vertical lip!)
ramp_mesh = bpy.data.meshes.new("SkyBridge_Stair_Ramp_Prism")
rbm = bmesh.new()
rw = 1.2 # 2.4m wide
# 4 top surface vertices (smooth continuous walking incline)
v1 = rbm.verts.new((-rw, stair_start_y, stair_start_z))
v2 = rbm.verts.new(( rw, stair_start_y, stair_start_z))
v3 = rbm.verts.new(( rw, stair_end_y, stair_end_z))
v4 = rbm.verts.new((-rw, stair_end_y, stair_end_z))
# 4 bottom underside vertices
v5 = rbm.verts.new((-rw, stair_start_y, stair_start_z - 0.25))
v6 = rbm.verts.new(( rw, stair_start_y, stair_start_z - 0.25))
v7 = rbm.verts.new(( rw, stair_end_y, stair_end_z - 0.25))
v8 = rbm.verts.new((-rw, stair_end_y, stair_end_z - 0.25))

rbm.faces.new([v1, v2, v3, v4]) # top
rbm.faces.new([v6, v5, v8, v7]) # bottom
rbm.faces.new([v1, v4, v8, v5]) # left
rbm.faces.new([v3, v2, v6, v7]) # right
rbm.faces.new([v4, v3, v7, v8]) # top end
rbm.faces.new([v2, v1, v5, v6]) # bottom front
rbm.to_mesh(ramp_mesh)
rbm.free()

ramp_obj = bpy.data.objects.new("SkyBridge_Stair_Solid_Ramp", ramp_mesh)
bpy.context.scene.collection.objects.link(ramp_obj)
ramp_obj.data.materials.append(mat_stone)

# 2. Visual Architectural Stone Treads (Travertine slabs with warm under-tread LED lights)
num_steps = 20
for s in range(num_steps):
    step_t = (s + 0.5) / num_steps
    step_y = stair_start_y + step_t * (stair_end_y - stair_start_y)
    step_z = stair_start_z + step_t * (stair_end_z - stair_start_z)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, step_y, step_z + 0.02))
    step = bpy.context.active_object
    step.name = f"SkyBridge_Stair_{s}"
    step.scale = (2.4, 0.32, 0.04)
    bpy.ops.object.transform_apply(scale=True)
    step.data.materials.append(mat_marble)

    # Warm LED strip under step nose
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, step_y + 0.15, step_z + 0.01))
    step_light = bpy.context.active_object
    step_light.name = f"SkyBridge_Stair_Light_{s}"
    step_light.scale = (2.2, 0.02, 0.015)
    bpy.ops.object.transform_apply(scale=True)
    step_light.data.materials.append(mat_glow_gold)

# 3. Precision Glass Balustrades and Architectural Handrails along the Grand Staircase
for side_x in [-1.22, 1.22]:
    # Architectural Clear Glass Balustrade Panel
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(side_x, stair_mid_y, stair_mid_z + 0.55))
    stair_glass = bpy.context.active_object
    stair_glass.name = f"SkyBridge_Stair_Glass_{side_x}"
    stair_glass.scale = (0.04, stair_length, 0.90)
    stair_glass.rotation_euler = (stair_slope_angle, 0, 0)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    stair_glass.data.materials.append(mat_glass)

    # Brushed Bronze Top Handrail
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(side_x, stair_mid_y, stair_mid_z + 1.02))
    top_rail = bpy.context.active_object
    top_rail.name = f"SkyBridge_Stair_Handrail_{side_x}"
    top_rail.scale = (0.07, stair_length + 0.05, 0.05)
    top_rail.rotation_euler = (stair_slope_angle, 0, 0)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    top_rail.data.materials.append(mat_bronze)

    # Brushed Bronze Bottom Mounting Shoe
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(side_x, stair_mid_y, stair_mid_z + 0.08))
    base_shoe = bpy.context.active_object
    base_shoe.name = f"SkyBridge_Stair_BaseShoe_{side_x}"
    base_shoe.scale = (0.07, stair_length + 0.05, 0.06)
    base_shoe.rotation_euler = (stair_slope_angle, 0, 0)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    base_shoe.data.materials.append(mat_bronze)

    # Vertical Stanchion Posts
    for t_post in [0.0, 0.25, 0.5, 0.75, 1.0]:
        py = stair_start_y + t_post * (stair_end_y - stair_start_y)
        pz = stair_start_z + t_post * (stair_end_z - stair_start_z) + 0.55
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(side_x, py, pz))
        post = bpy.context.active_object
        post.name = f"SkyBridge_Stair_Post_{side_x}_{t_post}"
        post.scale = (0.055, 0.055, 0.95)
        bpy.ops.object.transform_apply(scale=True)
        post.data.materials.append(mat_bronze)

# 4. Mezzanine Atrium Glass Guardrails and Bronze Coping (Upper Penthouse Floor Void)
# Void spans X = -1.35 to +1.35, Y = -3.10 to +0.60, floor surface at Z = 7.30
mz_z_base = 7.15 + 0.15 # 7.30 floor surface
mz_h = 1.05

# A. Right Mezzanine Guardrail (along X = 1.35, from Y = -3.10 to +0.60, length 3.70m)
r_len = 3.70
r_mid_y = -1.25
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(1.35, r_mid_y, mz_z_base + (mz_h * 0.5)))
r_glass = bpy.context.active_object
r_glass.name = "Mezzanine_Glass_Right"
r_glass.scale = (0.04, r_len, mz_h - 0.10)
bpy.ops.object.transform_apply(scale=True)
r_glass.data.materials.append(mat_glass)

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(1.35, r_mid_y, mz_z_base + mz_h))
r_rail = bpy.context.active_object
r_rail.name = "Mezzanine_Handrail_Right"
r_rail.scale = (0.07, r_len + 0.05, 0.05)
bpy.ops.object.transform_apply(scale=True)
r_rail.data.materials.append(mat_bronze)

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(1.35, r_mid_y, mz_z_base + 0.04))
r_shoe = bpy.context.active_object
r_shoe.name = "Mezzanine_BaseShoe_Right"
r_shoe.scale = (0.07, r_len + 0.05, 0.08)
bpy.ops.object.transform_apply(scale=True)
r_shoe.data.materials.append(mat_bronze)

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(1.35, r_mid_y, 7.15))
r_coping = bpy.context.active_object
r_coping.name = "Mezzanine_Coping_Right"
r_coping.scale = (0.05, r_len, 0.32)
bpy.ops.object.transform_apply(scale=True)
r_coping.data.materials.append(mat_bronze)

for py in [-3.10, -1.85, -0.60, 0.60]:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(1.35, py, mz_z_base + (mz_h * 0.5)))
    r_post = bpy.context.active_object
    r_post.name = f"Mezzanine_Post_Right_{py}"
    r_post.scale = (0.055, 0.055, mz_h)
    bpy.ops.object.transform_apply(scale=True)
    r_post.data.materials.append(mat_bronze)

# B. Front Catwalk Mezzanine Guardrail (along Y = 0.60, from X = -1.35 to +1.35, width 2.70m)
f_len = 2.70
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.60, mz_z_base + (mz_h * 0.5)))
f_glass = bpy.context.active_object
f_glass.name = "Mezzanine_Glass_Front"
f_glass.scale = (f_len, 0.04, mz_h - 0.10)
bpy.ops.object.transform_apply(scale=True)
f_glass.data.materials.append(mat_glass)

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.60, mz_z_base + mz_h))
f_rail = bpy.context.active_object
f_rail.name = "Mezzanine_Handrail_Front"
f_rail.scale = (f_len + 0.05, 0.07, 0.05)
bpy.ops.object.transform_apply(scale=True)
f_rail.data.materials.append(mat_bronze)

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.60, mz_z_base + 0.04))
f_shoe = bpy.context.active_object
f_shoe.name = "Mezzanine_BaseShoe_Front"
f_shoe.scale = (f_len + 0.05, 0.07, 0.08)
bpy.ops.object.transform_apply(scale=True)
f_shoe.data.materials.append(mat_bronze)

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.60, 7.15))
f_coping = bpy.context.active_object
f_coping.name = "Mezzanine_Coping_Front"
f_coping.scale = (f_len, 0.05, 0.32)
bpy.ops.object.transform_apply(scale=True)
f_coping.data.materials.append(mat_bronze)

for px in [-1.35, 0.0, 1.35]:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(px, 0.60, mz_z_base + (mz_h * 0.5)))
    f_post = bpy.context.active_object
    f_post.name = f"Mezzanine_Post_Front_{px}"
    f_post.scale = (0.055, 0.055, mz_h)
    bpy.ops.object.transform_apply(scale=True)
    f_post.data.materials.append(mat_bronze)

# C. Left Return Mezzanine Guardrail (along X = -1.35, from Y = -1.10 to +0.60, length 1.70m)
l_len = 1.70
l_mid_y = -0.25
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-1.35, l_mid_y, mz_z_base + (mz_h * 0.5)))
l_glass = bpy.context.active_object
l_glass.name = "Mezzanine_Glass_Left"
l_glass.scale = (0.04, l_len, mz_h - 0.10)
bpy.ops.object.transform_apply(scale=True)
l_glass.data.materials.append(mat_glass)

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-1.35, l_mid_y, mz_z_base + mz_h))
l_rail = bpy.context.active_object
l_rail.name = "Mezzanine_Handrail_Left"
l_rail.scale = (0.07, l_len + 0.05, 0.05)
bpy.ops.object.transform_apply(scale=True)
l_rail.data.materials.append(mat_bronze)

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-1.35, l_mid_y, mz_z_base + 0.04))
l_shoe = bpy.context.active_object
l_shoe.name = "Mezzanine_BaseShoe_Left"
l_shoe.scale = (0.07, l_len + 0.05, 0.08)
bpy.ops.object.transform_apply(scale=True)
l_shoe.data.materials.append(mat_bronze)

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-1.35, l_mid_y, 7.15))
l_coping = bpy.context.active_object
l_coping.name = "Mezzanine_Coping_Left"
l_coping.scale = (0.05, l_len, 0.32)
bpy.ops.object.transform_apply(scale=True)
l_coping.data.materials.append(mat_bronze)

for py in [-1.10, -0.25, 0.60]:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-1.35, py, mz_z_base + (mz_h * 0.5)))
    l_post = bpy.context.active_object
    l_post.name = f"Mezzanine_Post_Left_{py}"
    l_post.scale = (0.055, 0.055, mz_h)
    bpy.ops.object.transform_apply(scale=True)
    l_post.data.materials.append(mat_bronze)

# 5. Multi-Tier Glowing Architectural Chandelier suspended in Double-Height Atrium
ch_cx, ch_cy = 0.0, -1.25
for ch_idx, (ch_z, ch_sx, ch_sy) in enumerate([(9.9, 2.0, 2.8), (9.3, 1.4, 2.0), (8.7, 0.8, 1.2)]):
    # Outer bronze ring frame
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(ch_cx, ch_cy, ch_z))
    ch_frame = bpy.context.active_object
    ch_frame.name = f"Chandelier_Frame_{ch_idx}"
    ch_frame.scale = (ch_sx, ch_sy, 0.04)
    bpy.ops.object.transform_apply(scale=True)
    ch_frame.data.materials.append(mat_bronze)

    # Glowing warm LED halo inset
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(ch_cx, ch_cy, ch_z - 0.02))
    ch_light = bpy.context.active_object
    ch_light.name = f"Chandelier_Glow_{ch_idx}"
    ch_light.scale = (ch_sx - 0.08, ch_sy - 0.08, 0.02)
    bpy.ops.object.transform_apply(scale=True)
    ch_light.data.materials.append(mat_glow_gold)

# Suspension slim cables from ceiling
for cab_x, cab_y in [(-0.9, -2.5), (0.9, -2.5), (-0.9, 0.0), (0.9, 0.0)]:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cab_x, cab_y, 9.85))
    cable = bpy.context.active_object
    cable.name = f"Chandelier_Cable_{cab_x}_{cab_y}"
    cable.scale = (0.015, 0.015, 2.0)
    bpy.ops.object.transform_apply(scale=True)
    cable.data.materials.append(mat_bronze)

# 6. Luxury Architectural Planter Boxes on Penthouse Landing
for pl_x, pl_y in [(-2.2, -3.2), (2.2, -3.2), (0.0, 3.8)]:
    # Fluted Bronze Planter Pot
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(pl_x, pl_y, mz_z_base + 0.40))
    pot = bpy.context.active_object
    pot.name = f"Luxury_Planter_Pot_{pl_x}_{pl_y}"
    pot.scale = (0.70, 0.70, 0.80)
    bpy.ops.object.transform_apply(scale=True)
    pot.data.materials.append(mat_bronze)

    # Lush Tropical Foliage
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(pl_x, pl_y, mz_z_base + 1.05))
    plant = bpy.context.active_object
    plant.name = f"Luxury_Planter_Plant_{pl_x}_{pl_y}"
    plant.scale = (0.85, 0.85, 0.70)
    bpy.ops.object.transform_apply(scale=True)
    plant.data.materials.append(mat_foliage)


# 3. Front Curtain Wall Facade & Entrance (Facing FORWARD +Y at Y = 7.8)
for side_x, p_side in [(-3.8, "Left"), (3.8, "Right")]:
    # Architectural Glass Panel
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(side_x, 7.8, 4.3))
    front_g = bpy.context.active_object
    front_g.name = f"Reception_Glass_{p_side}"
    front_g.scale = (3.8, 0.08, 3.4)
    bpy.ops.object.transform_apply(scale=True)
    front_g.data.materials.append(mat_glass)

    # Bronze Base & Top Sill Frames
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(side_x, 7.8, 2.6))
    sill_b = bpy.context.active_object
    sill_b.name = f"Reception_SillBottom_{p_side}"
    sill_b.scale = (3.9, 0.16, 0.18)
    bpy.ops.object.transform_apply(scale=True)
    sill_b.data.materials.append(mat_bronze)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(side_x, 7.8, 6.0))
    sill_t = bpy.context.active_object
    sill_t.name = f"Reception_SillTop_{p_side}"
    sill_t.scale = (3.9, 0.16, 0.18)
    bpy.ops.object.transform_apply(scale=True)
    sill_t.data.materials.append(mat_bronze)

# 4. Open Grand Bronze Entrance Portal Frame (Facing FORWARD +Y at Y = 7.8)
# Left Bronze Pillar
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-1.8, 7.8, 4.3))
post_l = bpy.context.active_object
post_l.name = "Reception_Portal_Pillar_Left"
post_l.scale = (0.24, 0.36, 3.6)
bpy.ops.object.transform_apply(scale=True)
post_l.data.materials.append(mat_bronze)

# Right Bronze Pillar
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(1.8, 7.8, 4.3))
post_r = bpy.context.active_object
post_r.name = "Reception_Portal_Pillar_Right"
post_r.scale = (0.24, 0.36, 3.6)
bpy.ops.object.transform_apply(scale=True)
post_r.data.materials.append(mat_bronze)

# Overhead Transom Lintel (Above door height 5.7m)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 7.8, 5.85))
lintel = bpy.context.active_object
lintel.name = "Reception_Portal_Lintel"
lintel.scale = (3.84, 0.36, 0.32)
bpy.ops.object.transform_apply(scale=True)
lintel.data.materials.append(mat_bronze)

# Reception Welcome Desk in Lounge
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 4.5, 3.05))
desk = bpy.context.active_object
desk.name = "Reception_Counter_Desk"
desk.scale = (3.6, 1.2, 1.1)
bpy.ops.object.transform_apply(scale=True)
desk.data.materials.append(mat_bronze)


# -------------------------------------------------------------------------
# 7. Camera & Sunset Twilight Lighting
# -------------------------------------------------------------------------
bpy.ops.object.camera_add(location=(-3.0, -46.0, 18.0))
cam = bpy.context.active_object
cam.name = "Villa_Hero_Camera"
cam.rotation_euler = (math.radians(76), 0, math.radians(2))
cam.data.lens = 45.0
bpy.context.scene.camera = cam

# Warm Sunset Sun
bpy.ops.object.light_add(type='SUN', location=(-40.0, -50.0, 30.0))
sun = bpy.context.active_object
sun.name = "Sunset_Sun"
sun.data.energy = 5.5
sun.data.color = (1.0, 0.78, 0.58)
sun.rotation_euler = (math.radians(65), math.radians(-10), math.radians(45))

# Sky Ambient Fill
bpy.ops.object.light_add(type='SUN', location=(30.0, 40.0, 40.0))
sky = bpy.context.active_object
sky.name = "Sky_Ambient"
sky.data.energy = 1.4
sky.data.color = (0.55, 0.75, 0.98)
sky.rotation_euler = (math.radians(75), 0, math.radians(-110))

bpy.context.scene.render.engine = 'CYCLES'

# -------------------------------------------------------------------------
# 8. Turn House Structure 180 Degrees to Face the Stepped Podium
# -------------------------------------------------------------------------
import mathutils
R_z180 = mathutils.Matrix.Rotation(math.pi, 4, 'Z')
for obj in bpy.data.objects:
    if obj.type == 'MESH' and not obj.name.startswith('Podium_Step'):
        obj.matrix_world = R_z180 @ obj.matrix_world
        bpy.ops.object.select_all(action='DESELECT')
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        try:
            bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
        except Exception:
            pass
