import { deserialize } from "../etc"

const nodes = [
    { "id": "7caaf189-61e5-49fa-bee9-7f97b6bee4db", "x": 120, "y": 73, "edges": ["fdea4106-2db6-4ea0-9d24-1b349a6a9cb9", "a5cb1fab-e0e1-4cdb-84d8-66c2512f56dd"] }, { "id": "bf7e26d7-00f8-45c8-a7eb-a9416165294f", "x": 1001, "y": 678, "edges": ["e972d879-b995-4cd0-aca3-fc5a091ad5d4", "ef698c16-92ec-4f8c-9a49-84bee99d3a13"] }, { "id": "4cee26b4-b218-4266-9aa1-d91d4bfdfe9b", "x": 1008, "y": 80, "edges": ["58ac7fa8-9d70-4056-987a-cb688d02ac94", "8871dc48-7524-4e75-b709-31fe75e35a37"] }, { "id": "3248edd0-759b-4adc-9e4f-633175f09a0a", "x": 118, "y": 680, "edges": ["14383f30-fc42-446b-bbe7-6b063221d61e", "edf6c909-4f0e-46f9-935b-ed0b93d5440a"] }, { "id": "99d13f8e-4332-460d-aff7-c417d43d7ed7", "x": 124, "y": 234, "edges": ["fdea4106-2db6-4ea0-9d24-1b349a6a9cb9", "ed769aee-0389-4832-95d9-5be653b625ee", "41a1c059-0980-4db1-8c29-4ca9a530f922"] }, { "id": "eb53a913-a4ad-4509-b920-e24fe19b91ac", "x": 1009, "y": 230, "edges": ["112b257e-9799-4196-8e69-f49238263828", "58ac7fa8-9d70-4056-987a-cb688d02ac94", "d323f988-f0a4-4f43-b68c-fb49adc2d015"] }, { "id": "ff70afc4-d407-4b4d-9792-d6ea679a83f2", "x": 1017, "y": 395, "edges": ["7f9d01f7-985e-4fc0-8d1c-b503f9d8f084", "112b257e-9799-4196-8e69-f49238263828", "949d774b-31c8-4083-9b32-264171c437e7"] }, { "id": "e98198c6-c1d4-47de-8914-e3d0f919e455", "x": 1016, "y": 540, "edges": ["ef698c16-92ec-4f8c-9a49-84bee99d3a13", "7f9d01f7-985e-4fc0-8d1c-b503f9d8f084", "4cabb1fb-92ca-4a38-b9ef-7c36d4c6da41"] }, { "id": "a288fad9-6408-4ba2-9475-db2ab2c65d3a", "x": 124, "y": 523, "edges": ["f08e6f40-a93e-4cea-a982-2713b71ab8dc", "14383f30-fc42-446b-bbe7-6b063221d61e", "a709f2c8-f587-44df-8f82-38587965a451"] }, { "id": "16b01477-179e-4705-aae6-a027301d4f16", "x": 125, "y": 394, "edges": ["ed769aee-0389-4832-95d9-5be653b625ee", "f08e6f40-a93e-4cea-a982-2713b71ab8dc", "28a05cde-bd35-4679-bb60-8a04844c7723"] }, { "id": "c003aab5-6009-4fb9-a61b-a8e2878ca425", "x": 350, "y": 84, "edges": ["a5cb1fab-e0e1-4cdb-84d8-66c2512f56dd", "32531d38-eb08-4c9c-b1ac-c311f067ea6a", "5894de7d-a6ad-40ec-8330-4adfa3d60e72"] }, { "id": "e8566ec9-2587-487b-b896-4206cdb3491f", "x": 568, "y": 73, "edges": ["32531d38-eb08-4c9c-b1ac-c311f067ea6a", "dd80d590-b658-41ee-9195-79f57e4e35fa", "ce16353d-34fa-4f5e-a54a-00cbd64fc7eb"] }, { "id": "f2670ad0-27a6-4e00-bb72-f34ba98ed4f6", "x": 794, "y": 82, "edges": ["8871dc48-7524-4e75-b709-31fe75e35a37", "dd80d590-b658-41ee-9195-79f57e4e35fa", "0f602d46-8caa-44bf-a4f6-6c8180dc4451"] }, { "id": "52571676-7032-4320-b8b3-7594ef7115da", "x": 840, "y": 682, "edges": ["98d0241a-ebdf-45c5-9c51-2998e1c9aa29", "e972d879-b995-4cd0-aca3-fc5a091ad5d4", "3a838fff-f107-4ed8-b4c7-d2006c7b76fe"] }, { "id": "cc3b3d9e-3e39-4e95-a9eb-a2816bc3fefd", "x": 597, "y": 682, "edges": ["958ec271-3d28-472b-9955-c0319435ba46", "98d0241a-ebdf-45c5-9c51-2998e1c9aa29", "049c12ab-0bad-4e49-92d7-28307563cd6c"] }, { "id": "3a6a65bf-6837-47f5-b1ec-9d19e2a0b6dd", "x": 373, "y": 679, "edges": ["edf6c909-4f0e-46f9-935b-ed0b93d5440a", "958ec271-3d28-472b-9955-c0319435ba46", "5c496259-c469-4033-9baf-52dc8dd9ecca"] }, { "id": "4cada650-f6e7-4a83-9bb3-45eb8ca78251", "x": 367.14887743731015, "y": 527.6340032695451, "edges": ["a709f2c8-f587-44df-8f82-38587965a451", "5c496259-c469-4033-9baf-52dc8dd9ecca", "833c1c26-eefe-4106-8514-860ec200412a", "7e5a849a-2d44-430c-b66d-309d6bb2bf1c"] }, { "id": "94ca6c2b-e696-469b-92fd-067605411648", "x": 361.993463559675, "y": 394.26568773941665, "edges": ["28a05cde-bd35-4679-bb60-8a04844c7723", "833c1c26-eefe-4106-8514-860ec200412a", "38ddea27-ce1b-4be1-9cb5-cfc9ed636a2f", "bae75738-61a0-4483-a675-0b27a9458066"] }, { "id": "69111efc-9d5b-449f-b8f0-a461deee80f6", "x": 355.7578280013747, "y": 232.95250699208418, "edges": ["41a1c059-0980-4db1-8c29-4ca9a530f922", "38ddea27-ce1b-4be1-9cb5-cfc9ed636a2f", "5894de7d-a6ad-40ec-8330-4adfa3d60e72", "3572c7da-35d4-4f65-baa3-d66deb575ca8"] }, { "id": "3049da2a-4f45-496d-b407-eaf032bf4763", "x": 575.5694765721663, "y": 231.95900801549303, "edges": ["3572c7da-35d4-4f65-baa3-d66deb575ca8", "ce16353d-34fa-4f5e-a54a-00cbd64fc7eb", "b8b76b6d-6d5d-4abe-a8c0-fe254c005175", "9c3408b8-8f38-4b5c-aab1-1d2023ff02aa"] }, { "id": "3e2e3145-a896-4f00-992c-6ee05e1bca3e", "x": 583.3101809833965, "y": 394.5138006513267, "edges": ["bae75738-61a0-4483-a675-0b27a9458066", "b8b76b6d-6d5d-4abe-a8c0-fe254c005175", "01cc1902-0132-4c67-aeb6-4c7160d4c535", "28511ab0-4b9c-4e7e-9798-30bb2e0e1619"] }, { "id": "d8111ad4-638b-413d-8e5f-892b0ed39366", "x": 589.8513491851456, "y": 531.8783328880577, "edges": ["7e5a849a-2d44-430c-b66d-309d6bb2bf1c", "01cc1902-0132-4c67-aeb6-4c7160d4c535", "049c12ab-0bad-4e49-92d7-28307563cd6c", "dabc620d-0122-4993-a943-9b4e98786fd8"] }, { "id": "bd73520b-61cb-4ced-a830-004c4a73b4b7", "x": 828.8398669206501, "y": 536.4330467910886, "edges": ["dabc620d-0122-4993-a943-9b4e98786fd8", "4cabb1fb-92ca-4a38-b9ef-7c36d4c6da41", "3a838fff-f107-4ed8-b4c7-d2006c7b76fe", "2ce9ee8a-dd4b-45fd-bbe3-771eaefd2984"] }, { "id": "2503e550-f185-41ca-819f-060fc7bd5452", "x": 817.9795610235558, "y": 394.7768829159457, "edges": ["949d774b-31c8-4083-9b32-264171c437e7", "28511ab0-4b9c-4e7e-9798-30bb2e0e1619", "2ce9ee8a-dd4b-45fd-bbe3-771eaefd2984", "e2e98e50-ad8c-4ac9-80a8-b7f5e18daa87"] }, { "id": "6ceb1e87-19df-44ee-91db-c3e78f5077d5", "x": 805.417211361788, "y": 230.92014819723485, "edges": ["9c3408b8-8f38-4b5c-aab1-1d2023ff02aa", "d323f988-f0a4-4f43-b68c-fb49adc2d015", "e2e98e50-ad8c-4ac9-80a8-b7f5e18daa87", "0f602d46-8caa-44bf-a4f6-6c8180dc4451"] },
]

const edges = [
    { "id": "fdea4106-2db6-4ea0-9d24-1b349a6a9cb9", "start": "7caaf189-61e5-49fa-bee9-7f97b6bee4db", "end": "99d13f8e-4332-460d-aff7-c417d43d7ed7" }, { "id": "ed769aee-0389-4832-95d9-5be653b625ee", "start": "99d13f8e-4332-460d-aff7-c417d43d7ed7", "end": "16b01477-179e-4705-aae6-a027301d4f16" }, { "id": "f08e6f40-a93e-4cea-a982-2713b71ab8dc", "start": "16b01477-179e-4705-aae6-a027301d4f16", "end": "a288fad9-6408-4ba2-9475-db2ab2c65d3a" }, { "id": "14383f30-fc42-446b-bbe7-6b063221d61e", "start": "a288fad9-6408-4ba2-9475-db2ab2c65d3a", "end": "3248edd0-759b-4adc-9e4f-633175f09a0a" }, { "id": "edf6c909-4f0e-46f9-935b-ed0b93d5440a", "start": "3248edd0-759b-4adc-9e4f-633175f09a0a", "end": "3a6a65bf-6837-47f5-b1ec-9d19e2a0b6dd" }, { "id": "958ec271-3d28-472b-9955-c0319435ba46", "start": "3a6a65bf-6837-47f5-b1ec-9d19e2a0b6dd", "end": "cc3b3d9e-3e39-4e95-a9eb-a2816bc3fefd" }, { "id": "98d0241a-ebdf-45c5-9c51-2998e1c9aa29", "start": "cc3b3d9e-3e39-4e95-a9eb-a2816bc3fefd", "end": "52571676-7032-4320-b8b3-7594ef7115da" }, { "id": "e972d879-b995-4cd0-aca3-fc5a091ad5d4", "start": "52571676-7032-4320-b8b3-7594ef7115da", "end": "bf7e26d7-00f8-45c8-a7eb-a9416165294f" }, { "id": "ef698c16-92ec-4f8c-9a49-84bee99d3a13", "start": "bf7e26d7-00f8-45c8-a7eb-a9416165294f", "end": "e98198c6-c1d4-47de-8914-e3d0f919e455" }, { "id": "7f9d01f7-985e-4fc0-8d1c-b503f9d8f084", "start": "e98198c6-c1d4-47de-8914-e3d0f919e455", "end": "ff70afc4-d407-4b4d-9792-d6ea679a83f2" }, { "id": "112b257e-9799-4196-8e69-f49238263828", "start": "ff70afc4-d407-4b4d-9792-d6ea679a83f2", "end": "eb53a913-a4ad-4509-b920-e24fe19b91ac" }, { "id": "58ac7fa8-9d70-4056-987a-cb688d02ac94", "start": "eb53a913-a4ad-4509-b920-e24fe19b91ac", "end": "4cee26b4-b218-4266-9aa1-d91d4bfdfe9b" }, { "id": "8871dc48-7524-4e75-b709-31fe75e35a37", "start": "f2670ad0-27a6-4e00-bb72-f34ba98ed4f6", "end": "4cee26b4-b218-4266-9aa1-d91d4bfdfe9b" }, { "id": "a5cb1fab-e0e1-4cdb-84d8-66c2512f56dd", "start": "7caaf189-61e5-49fa-bee9-7f97b6bee4db", "end": "c003aab5-6009-4fb9-a61b-a8e2878ca425" }, { "id": "32531d38-eb08-4c9c-b1ac-c311f067ea6a", "start": "c003aab5-6009-4fb9-a61b-a8e2878ca425", "end": "e8566ec9-2587-487b-b896-4206cdb3491f" }, { "id": "dd80d590-b658-41ee-9195-79f57e4e35fa", "start": "e8566ec9-2587-487b-b896-4206cdb3491f", "end": "f2670ad0-27a6-4e00-bb72-f34ba98ed4f6" }, { "id": "a709f2c8-f587-44df-8f82-38587965a451", "start": "a288fad9-6408-4ba2-9475-db2ab2c65d3a", "end": "4cada650-f6e7-4a83-9bb3-45eb8ca78251" }, { "id": "5c496259-c469-4033-9baf-52dc8dd9ecca", "start": "3a6a65bf-6837-47f5-b1ec-9d19e2a0b6dd", "end": "4cada650-f6e7-4a83-9bb3-45eb8ca78251" }, { "id": "28a05cde-bd35-4679-bb60-8a04844c7723", "start": "94ca6c2b-e696-469b-92fd-067605411648", "end": "16b01477-179e-4705-aae6-a027301d4f16" }, { "id": "833c1c26-eefe-4106-8514-860ec200412a", "start": "4cada650-f6e7-4a83-9bb3-45eb8ca78251", "end": "94ca6c2b-e696-469b-92fd-067605411648" }, { "id": "41a1c059-0980-4db1-8c29-4ca9a530f922", "start": "99d13f8e-4332-460d-aff7-c417d43d7ed7", "end": "69111efc-9d5b-449f-b8f0-a461deee80f6" }, { "id": "38ddea27-ce1b-4be1-9cb5-cfc9ed636a2f", "start": "94ca6c2b-e696-469b-92fd-067605411648", "end": "69111efc-9d5b-449f-b8f0-a461deee80f6" }, { "id": "5894de7d-a6ad-40ec-8330-4adfa3d60e72", "start": "69111efc-9d5b-449f-b8f0-a461deee80f6", "end": "c003aab5-6009-4fb9-a61b-a8e2878ca425" }, { "id": "3572c7da-35d4-4f65-baa3-d66deb575ca8", "start": "69111efc-9d5b-449f-b8f0-a461deee80f6", "end": "3049da2a-4f45-496d-b407-eaf032bf4763" }, { "id": "ce16353d-34fa-4f5e-a54a-00cbd64fc7eb", "start": "e8566ec9-2587-487b-b896-4206cdb3491f", "end": "3049da2a-4f45-496d-b407-eaf032bf4763" }, { "id": "bae75738-61a0-4483-a675-0b27a9458066", "start": "3e2e3145-a896-4f00-992c-6ee05e1bca3e", "end": "94ca6c2b-e696-469b-92fd-067605411648" }, { "id": "b8b76b6d-6d5d-4abe-a8c0-fe254c005175", "start": "3049da2a-4f45-496d-b407-eaf032bf4763", "end": "3e2e3145-a896-4f00-992c-6ee05e1bca3e" }, { "id": "7e5a849a-2d44-430c-b66d-309d6bb2bf1c", "start": "4cada650-f6e7-4a83-9bb3-45eb8ca78251", "end": "d8111ad4-638b-413d-8e5f-892b0ed39366" }, { "id": "01cc1902-0132-4c67-aeb6-4c7160d4c535", "start": "3e2e3145-a896-4f00-992c-6ee05e1bca3e", "end": "d8111ad4-638b-413d-8e5f-892b0ed39366" }, { "id": "049c12ab-0bad-4e49-92d7-28307563cd6c", "start": "d8111ad4-638b-413d-8e5f-892b0ed39366", "end": "cc3b3d9e-3e39-4e95-a9eb-a2816bc3fefd" }, { "id": "dabc620d-0122-4993-a943-9b4e98786fd8", "start": "d8111ad4-638b-413d-8e5f-892b0ed39366", "end": "bd73520b-61cb-4ced-a830-004c4a73b4b7" }, { "id": "4cabb1fb-92ca-4a38-b9ef-7c36d4c6da41", "start": "bd73520b-61cb-4ced-a830-004c4a73b4b7", "end": "e98198c6-c1d4-47de-8914-e3d0f919e455" }, { "id": "3a838fff-f107-4ed8-b4c7-d2006c7b76fe", "start": "52571676-7032-4320-b8b3-7594ef7115da", "end": "bd73520b-61cb-4ced-a830-004c4a73b4b7" }, { "id": "949d774b-31c8-4083-9b32-264171c437e7", "start": "ff70afc4-d407-4b4d-9792-d6ea679a83f2", "end": "2503e550-f185-41ca-819f-060fc7bd5452" }, { "id": "28511ab0-4b9c-4e7e-9798-30bb2e0e1619", "start": "2503e550-f185-41ca-819f-060fc7bd5452", "end": "3e2e3145-a896-4f00-992c-6ee05e1bca3e" }, { "id": "2ce9ee8a-dd4b-45fd-bbe3-771eaefd2984", "start": "bd73520b-61cb-4ced-a830-004c4a73b4b7", "end": "2503e550-f185-41ca-819f-060fc7bd5452" }, { "id": "9c3408b8-8f38-4b5c-aab1-1d2023ff02aa", "start": "3049da2a-4f45-496d-b407-eaf032bf4763", "end": "6ceb1e87-19df-44ee-91db-c3e78f5077d5" }, { "id": "d323f988-f0a4-4f43-b68c-fb49adc2d015", "start": "6ceb1e87-19df-44ee-91db-c3e78f5077d5", "end": "eb53a913-a4ad-4509-b920-e24fe19b91ac" }, { "id": "e2e98e50-ad8c-4ac9-80a8-b7f5e18daa87", "start": "2503e550-f185-41ca-819f-060fc7bd5452", "end": "6ceb1e87-19df-44ee-91db-c3e78f5077d5" }, { "id": "0f602d46-8caa-44bf-a4f6-6c8180dc4451", "start": "6ceb1e87-19df-44ee-91db-c3e78f5077d5", "end": "f2670ad0-27a6-4e00-bb72-f34ba98ed4f6" },
]

const SquareCity = () => {
    return deserialize(nodes, edges)
}

export default SquareCity