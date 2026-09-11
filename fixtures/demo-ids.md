# Demo IDs (shared across UI, API, ML)

Org: `org_apex` — Apex Manufacturing

| supplier_id | name | tier | parent_id | city |
|---|---|---|---|---|
| `sup_steelco` | SteelCo India | 1 | null | Mumbai |
| `sup_aluco` | AluCo Extrusions | 1 | null | Pune |
| `sup_plastix` | Plastix Components | 2 | `sup_steelco` | Chennai |
| `sup_cementa` | Cementa Works | 2 | `sup_aluco` | Ahmedabad |
| `sup_packright` | PackRight Films | 3 | `sup_plastix` | Bengaluru |
| `sup_quarry` | Deccan Quarry | 3 | `sup_cementa` | Nagpur |

Demo user: `demo@apex.example`  
Demo token: `demo-token-apex`
