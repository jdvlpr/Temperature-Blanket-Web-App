import type { CustomThemeConfig } from '@skeletonlabs/tw-plugin';

export const classic: CustomThemeConfig = {
  name: 'classic',
  properties: {
    // =~= Theme Properties =~=
    '--theme-font-family-base': 'apparat',
    '--theme-font-family-heading': 'apparat',
    '--theme-font-color-base': '0 0 0',
    '--theme-font-color-dark': '255 255 255',
    '--theme-rounded-base': '9999px',
    '--theme-rounded-container': '8px',
    '--theme-border-base': '0',
    // =~= Theme On-X Colors =~=
    '--on-primary': '255 255 255',
    '--on-secondary': '255 255 255',
    '--on-tertiary': '0 0 0',
    '--on-success': '0 0 0',
    '--on-warning': '0 0 0',
    '--on-error': '255 255 255',
    '--on-surface': '255 255 255',
    // =~= Theme Colors  =~=
    // primary | #fcd34d
    '--color-primary-50': '254 247 235', //#FEF7EB
    '--color-primary-100': '254 242 221', //#FEF2DD
    '--color-primary-200': '252 226 182', //#FCE2B6
    '--color-primary-300': '250 205 128', //#FACD80
    '--color-primary-400': '248 184 74', //#F8B84A
    '--color-primary-500': '245 158 11', //#F59E0B
    '--color-primary-600': '230 149 9', //#E69509
    '--color-primary-700': '216 140 9', //#D88C09
    '--color-primary-800': '206 133 8', //#CE8508
    '--color-primary-900': '191 124 8', //#BF7C08
    // secondary | #075985
    '--color-secondary-50': '221 242 253',
    '--color-secondary-100': '187 229 251',
    '--color-secondary-200': '114 201 248',
    '--color-secondary-300': '47 175 244',
    '--color-secondary-400': '11 136 203',
    '--color-secondary-500': '7 89 133',
    '--color-secondary-600': '6 71 107',
    '--color-secondary-700': '4 55 82',
    '--color-secondary-800': '3 36 53',
    '--color-secondary-900': '2 19 29',
    // tertiary | #2563eb
    '--color-tertiary-50': '222 232 252', // #dee8fc
    '--color-tertiary-100': '211 224 251', // #d3e0fb
    '--color-tertiary-200': '201 216 250', // #c9d8fa
    '--color-tertiary-300': '168 193 247', // #a8c1f7
    '--color-tertiary-400': '102 146 241', // #6692f1
    '--color-tertiary-500': '37 99 235', // #2563eb
    '--color-tertiary-600': '33 89 212', // #2159d4
    '--color-tertiary-700': '28 74 176', // #1c4ab0
    '--color-tertiary-800': '22 59 141', // #163b8d
    '--color-tertiary-900': '18 49 115', // #123173
    // success | #22c55e
    '--color-success-50': '222 246 231', // #def6e7
    '--color-success-100': '211 243 223', // #d3f3df
    '--color-success-200': '200 241 215', // #c8f1d7
    '--color-success-300': '167 232 191', // #a7e8bf
    '--color-success-400': '100 214 142', // #64d68e
    '--color-success-500': '34 197 94', // #22c55e
    '--color-success-600': '31 177 85', // #1fb155
    '--color-success-700': '26 148 71', // #1a9447
    '--color-success-800': '20 118 56', // #147638
    '--color-success-900': '17 97 46', // #11612e
    // warning | #fb923c
    '--color-warning-50': '254 239 226', // #feefe2
    '--color-warning-100': '254 233 216', // #fee9d8
    '--color-warning-200': '254 228 206', // #fee4ce
    '--color-warning-300': '253 211 177', // #fdd3b1
    '--color-warning-400': '252 179 119', // #fcb377
    '--color-warning-500': '251 146 60', // #fb923c
    '--color-warning-600': '226 131 54', // #e28336
    '--color-warning-700': '188 110 45', // #bc6e2d
    '--color-warning-800': '151 88 36', // #975824
    '--color-warning-900': '123 72 29', // #7b481d
    // error | #dc2626
    '--color-error-50': '250 222 222', // #fadede
    '--color-error-100': '248 212 212', // #f8d4d4
    '--color-error-200': '246 201 201', // #f6c9c9
    '--color-error-300': '241 168 168', // #f1a8a8
    '--color-error-400': '231 103 103', // #e76767
    '--color-error-500': '220 38 38', // #dc2626
    '--color-error-600': '198 34 34', // #c62222
    '--color-error-700': '165 29 29', // #a51d1d
    '--color-error-800': '132 23 23', // #841717
    '--color-error-900': '108 19 19', // #6c1313
    // surface | #64748b
    '--color-surface-50': '248 250 252', // #f8fafc
    '--color-surface-100': '241 245 249', // #f1f5f9
    '--color-surface-200': '226 232 240', // #e2e8f0
    '--color-surface-300': '203 213 225', // #cbd5e1
    '--color-surface-400': '148 163 184', // #94a3b8
    '--color-surface-500': '100 116 139', // #64748b
    '--color-surface-600': '71 85 105', // #475569
    '--color-surface-700': '51 65 85', // #334155
    '--color-surface-800': '30 41 59', // #1e293b
    '--color-surface-900': '15 23 42', // #0f172a
  },
};
