# BEEA — New Development

- **Endpoint:** `POST {BASE}/project/report/newdev`  (BASE = `https://sleb.sg/slebapi/beea`)
- **Auth:** `Authorization: Bearer <token>` (see FORMS_SPEC.md)
- **Fixed ProjectStatus:** `"New Development"`
- **Response:** `data.report` = Base64-encoded PDF → decode, show in a viewer, offer download
- **Example payload:** `docs/spec/examples/beea-new-development.request.json` (valid JSON, cleaned from the spec) and `.response.json`

Range notation (as in the API spec): `(a, b)` exclusive, `[a, b]` inclusive, `{"x", "y"}` allowed values, `∞` unbounded. All values are sent as **strings** except where Type says `int` or `array`.

## Request structure

```
ProjectName, ProjectAddress, ProjectPostalCode, ProjectCountry, ProjectGFA, ProjectStatus
BuildingData:
  BuildingInfo   {…}
  Facade         {…}
  ACSystem       {…}
  ADSystem       {…}
  LightingSystem {…}
  MVSystem       {…}
  OtherSystem    {…}
```

## Wizard steps and fields

### Step 1: Project

JSON location: root level of the request

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| Project Name | `ProjectName` | string | **Yes** |  | Project name |
| Project Address | `ProjectAddress` | string | **Yes** |  | Project address |
| Project Postal Code | `ProjectPostalCode` | string | **Yes** |  | Project postal code |
| Project Country | `ProjectCountry` | string | **Yes** |  | Project country |
| Project Gross Floor Area | `ProjectGFA` | string | **Yes** | (0, ∞) | Project gross floor area (excluding car park area) in m2 |
| Project Status | `ProjectStatus` | string | **Yes** | {“New Development} | Project status |

### Step 2: Building Information

JSON location: `BuildingData.BuildingInfo`

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| Building Name | `BuildingName` | string | **Yes** | free text | Building Name |
| Building Gross Floor Area | `GFA` | string | **Yes** | (0, ∞) | Building Gross Floor Area (excluding car park area) in m2 |
| Building Type | `BuildingType` | string | **Yes** | {“Office Building”, “Retail Building”, “Hotel”, “Healthcare Facility”, “Educational Institution”, “Industrial Building”, “Residential Building”, “Mixed Development”, “Others”} | Building Type |
| Number of Storeys | `Storey` | int | **Yes** | 1, 300 | Number of Storeys |
| Year of Temporary Occupation Permit or Certificate of Statutory Completion | `YearTOP` | string | **Yes** | 1900-9999 | Year of Temporary Occupation Permit or Certificate of Statutory Completion |
| Food and Beverage Area | `FBArea` | string | **Yes** | [0, ∞) | Food and Beverage Area in m2 / ⚠ Spec prints (0, ∞) but all its example requests send "0" (area not present). Treated as [0, ∞); confirm with SLEB |
| Supermarket Area | `SupermarArea` | string | **Yes** | [0, ∞) | Supermarket Area in m2 / ⚠ Spec prints (0, ∞) but all its example requests send "0" (area not present). Treated as [0, ∞); confirm with SLEB |
| Data Centre/Server Room Area | `DCArea` | string | **Yes** | (0, ∞) | Data Centre/Server Room Area in m2 |
| Total Building Operation | `Schedule` | string | **Yes** | (0, 168) | Total Building Operation in hours per week |
| Percentage of Air-Conditioned Area | `PACArea` | string | **Yes** | (0, 100) | Percentage of Air-Conditioned Area in % |
| Air Conditioning System Type | `ACType` | string | **Yes** | {“Water-cooled Chilled Water Plant”, “Air-cooled Chilled Water Plant”, “Unitary Air-conditioning System”, “District Cooling System”} | Air Conditioning System Type |
| Air Distribution System Type | `ExistingADType` | string | **Yes** | {“AHU-CAV”, “AHU-VAV”, “FCU-CAV”, “FCU-VAV”} | Air Distribution System Type |
| Total Mechanically Ventilated Area | `MVArea` | string | **Yes** | (0, ∞) | Total Mechanically Ventilated Area in m2 |

### Step 3: Facade

JSON location: `BuildingData.Facade`

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| Percentage of Natural Ventilation Area Converted from AC Area | `PNVArea` | string | **Yes** | (0, PACArea) | Percentage of Natural Ventilation Area Converted from AC Area (Design of natural ventilation) in % |
| Reduced Window to Wall Ratio | `WWR` | string | **Yes** | (0, 0.4) | Reduced Window to Wall Ratio |
| Roof U-Value (Insulation of roof) | `RoofU` | string | **Yes** | (0.2, 1.5) | Roof U-Value (Insulation of roof) in W/m²·K |
| Wall U-Value | `WallU` | string | **Yes** | (0.2, 1.5) | Wall U-Value (Insulation of external walls) in W/m²·K |
| Glass U-Value | `GlassU` | string | **Yes** | (0.5, 2.8) | Glass U-Value (Use of high-performance glass) in W/m²·K |
| Glass Solar Heat Gain Coefficient | `GlassSHGC` | string | **Yes** | (0.1, 0.35) | Solar Heat Gain Coefficient (Use of high-performance glass) |
| Solar Window Film U-Value | `FilmU` | string | **Yes** | (1, 10) | Solar Window Film U-Value (Use of solar window film) in W/m²·K |
| Film Solar Heat Gain Coefficient | `FilmSHGC` | string | **Yes** | (0.05, 0.6) | Solar Heat Gain Coefficient (Use of solar window film) |
| Window Frame U-Value | `FrameU` | string | **Yes** | (0.4, 1.2) | Window Frame U-Value (Use of thermally broken window frames) in W/m²·K |
| Solar Reflectivity | `PaintSR` | string | **Yes** | (0.3, 0.9) | Solar Reflectivity (Use of reflective paint/cool paint) |
| Shading Coefficient | `Shading` | string | **Yes** | (0.1, 0.9) | Shading Coefficient (Installation of external shading devices) |

### Step 4: Air Conditioning (A/C) System

JSON location: `BuildingData.ACSystem`

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| Energy-Efficient Chiller | `ChillerEffi` | string | **Yes** | 0.4, 0.9 (if ACType == “Water-cooled Chilled Water Plant”)<br>0.8, 1.5 (if ACType == “Air-cooled Chilled Water Plant”) | Energy-Efficient Chiller (For air conditioning system type of water-cooled chilled water plant, air-cooled chilled water plant) in kW/RT |
| Energy-Efficient Chilled Water Pump | `CHWPEffi` | string | **Yes** | (160, 350) | Energy-Efficient Chilled Water Pump (For air conditioning system type of water-cooled chilled water plant, air-cooled chilled water plant, district cooling system) in kW/m³/s |
| Energy Efficient Condensing Water Pump | `CWPEffi` | string | **Yes** | (140, 300) | Energy Efficient Condensing Water Pump (For air conditioning system type of water-cooled chilled water plant) in kW/m³/s |
| Energy-Efficient Cooling Tower | `CTEffi` | string | **Yes** | (1.7, 7) | Energy-Efficient Cooling Tower (For air conditioning system type of water-cooled chilled water plant) in L/s/kW |
| Air Conditioning System Optimisation | `ACOpt` | string | **Yes** | {“Yes”} | Air Conditioning System Optimisation (For air conditioning system type of water-cooled chilled water plant, air-cooled chilled water plant) |
| Energy-Efficient Unitary Air-Conditioning System | `UnitaryEffi` | string | **Yes** | (0.6, 1.1) | Energy-Efficient Unitary Air-Conditioning System (For air conditioning system type of unitary air-conditioning system) in kW/RT |

### Step 5: Air Distribution (A/D) System

JSON location: `BuildingData.ADSystem`

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| Use of Variable Speed Drive (VSD) in AHU/FCU | `ADType` | string | **Yes** | {“AHU-VAV”, “FCU-VAV”} | Use of Variable Speed Drive (VSD) in AHU/FCU (For air distribution system type of AHU-CAV and FCU-CAV) |
| Percentage Use of Alternative Cooling Technologies | `PACT` | string | **Yes** | (0, 100) | Percentage Use of Alternative Cooling Technologies in % |
| Energy Efficient Air Distribution Fan | `ADFanEffi` | string | **Yes** | 0.05, 0.18 (ExistingADType ==FCU-CAV and ADType==None)<br>0.2, 0.5 (ExistingADType ==AHU-CAV and ADType==None)<br>0.3, 0.6 (ExistingADType ==AHU-VAV or ADType==AHU-VAV)<br>0.06, 0.22 (ExistingADType ==FCU-VAV or ADType==FCU-VAV) | Energy Efficient Air Distribution Fan (For air conditioning system type of water-cooled chilled water plant, air-cooled chilled water plant, district cooling system) in W/CMH |
| Demand-Controlled Ventilation of AC Area | `DCV` | string | **Yes** | {“Yes”} | Demand-Controlled Ventilation of AC Area (For air conditioning system type of water-cooled chilled water plant, air-cooled chilled water plant, district cooling system) |
| Use of Energy Recovery Ventilation System | `ERVEffi` | string | **Yes** | (30, 95) | Use of Energy Recovery Ventilation System (For air conditioning system type of water-cooled chilled water plant, air-cooled chilled water plant, district cooling system) in % |
| Percentage Use of Fans to Offset Cooling Load | `PFan` | string | **Yes** | (0, 100) | Percentage Use of Fans to Offset Cooling Load in % |

### Step 6: Lighting System

JSON location: `BuildingData.LightingSystem`

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| LED Efficacy | `LEDEfficacy` | string | **Yes** | (70, 200) | LED Efficacy (Use of energy efficient LED lights) in lm/W |
| Percentage of Use of Energy Efficient LED Lights | `PLED` | string | **Yes** | (0, 100) | Percentage of Use of Energy Efficient LED Lights in % |
| Smart Lighting Control Percentage of Application | `PLigCrl` | string | **Yes** | (0, 100) | Percentage of Application (Use of smart lighting control) in % |
| Daylighting Percentage of Application | `PDaylight` | string | **Yes** | (0, 100) | Percentage of Application (Use of daylighting) in % |

### Step 7: Mechanical Ventilation (MV) System

JSON location: `BuildingData.MVSystem`

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| Energy-Efficient Mechanical Ventilation Fan | `MVFanEffi` | string | **Yes** | (0.05, 0.3) | Energy-Efficient Mechanical Ventilation Fan (Fan Efficiency) in W/CMH |
| Demand-Controlled Ventilation of MV Area | `PMVCrl` | string | **Yes** | (0, 100) | Demand-Controlled Ventilation of MV Area in % |

### Step 8: Other System

JSON location: `BuildingData.OtherSystem`

| Label | Variable | Type | Required | Range / allowed values | Description and rules |
|---|---|---|---|---|---|
| Use of Smart Plug Load Control | `PLC` | string | **Yes** | {“Yes”} | Use of Smart Plug Load Control |
| Use of Energy Efficient Appliances | `EfficientApp` | string | **Yes** | {“Yes”} | Use of Energy Efficient Appliances (For building type of residential building) |
| Use of Energy Efficient Hot Water System | `HWCOP` | string | **Yes** | (2, 5) | Use of Energy Efficient Hot Water System (For building type of hotel, healthcare facility, residential building) |
| Percentage Use of Solar Hot Water Collectors | `PSolarHW` | string | **Yes** | (0, 100) | Percentage Use of Solar Hot Water Collectors (for building type of hotel, healthcare facility, residential building) in % |
| Use of Energy Efficient Lift | `EfficientLift` | string | **Yes** | {“Yes”} | Use of Energy Efficient Lift |
| Use of Energy Efficient Escalator | `EfficientEscalator` | string | **Yes** | {“Yes”} | Use of Energy Efficient Escalator |
| Implementation of Building Energy Management System | `BEMS` | string | **Yes** | {“Yes”} | Implementation of Building Energy Management System |
| Rooftop Solar Panel Efficiency | `PVEffi` | string | **Yes** | (0, 100) | Rooftop Solar Panel Efficiency in % |
| Rooftop Solar Panel Area | `PVArea` | string | **Yes** | (0, ∞) | Rooftop Solar Panel Area in m2 |
| BIPV Solar Panel Efficiency | `BIPVEffi` | string | **Yes** | (0, 100) | BIPV Solar Panel Efficiency / in % |
| BIPV Solar Panel Area | `BIPVArea` | string | **Yes** | (0, ∞) | BIPV Solar Panel Area in m2 |


## Rules and conditional logic

### Fixed values (not user inputs)
- `ProjectStatus` is always `"New Development"` for this form. Do not show it as an editable field.

### Applicability of fields (derived from the field descriptions)
The spec marks every building field as "required", but many descriptions say they apply only to certain system or building types. The spec's own example requests only contain the applicable fields, so the app should **only show / send fields that apply** and omit the rest.

| Field | Send only when |
|---|---|
| `ChillerEffi` | `ACType` is "Water-cooled Chilled Water Plant" or "Air-cooled Chilled Water Plant" |
| `CHWPEffi` | `ACType` is Water-cooled, Air-cooled, or "District Cooling System" |
| `CWPEffi`, `CTEffi` | `ACType` is "Water-cooled Chilled Water Plant" |
| `ACOpt` | `ACType` is Water-cooled or Air-cooled chilled water plant |
| `UnitaryEffi` | `ACType` is "Unitary Air-conditioning System" |
| `ADType` | `ExistingADType` is "AHU-CAV" or "FCU-CAV" (it is the VSD upgrade: "AHU-VAV" / "FCU-VAV") |
| `ADFanEffi`, `DCV`, `ERVEffi` | `ACType` is Water-cooled, Air-cooled, or District Cooling |
| `HWCOP`, `PSolarHW` | `BuildingType` is "Hotel", "Healthcare Facility" or "Residential Building" |
| `EfficientApp` | `BuildingType` is "Residential Building" |

### Value-dependent ranges
- `ChillerEffi`: `0.4–0.9` kW/RT if `ACType` = Water-cooled; `0.8–1.5` kW/RT if Air-cooled. (Bracket style not printed; New Development notation uses exclusive ends for the other fields.)
- `ADFanEffi` (W/CMH) depends on the air-distribution type:

| Condition | Allowed range |
|---|---|
| `ExistingADType` = "FCU-CAV" and `ADType` omitted | 0.05 – 0.18 |
| `ExistingADType` = "AHU-CAV" and `ADType` omitted | 0.2 – 0.5 |
| `ExistingADType` = "AHU-VAV" or `ADType` = "AHU-VAV" | 0.3 – 0.6 |
| `ExistingADType` = "FCU-VAV" or `ADType` = "FCU-VAV" | 0.06 – 0.22 |

- `PNVArea` must be less than `PACArea` (range is `(0, PACArea)`).

### "Yes" toggles
`ACOpt`, `DCV`, `PLC`, `EfficientApp`, `EfficientLift`, `EfficientEscalator`, `BEMS` accept only the single value `"Yes"`. Model them as checkboxes; **when unchecked, omit the key** (the spec defines no "No" value; this is inferred from the examples, verify against the live API).

### Open questions (spec is silent)
- Whether an applicable measure the user is *not* implementing can be omitted, or whether every applicable field must be present.
- Relationship between `ProjectGFA` and `GFA` (examples use the same number; the app can default `GFA` from `ProjectGFA`).

