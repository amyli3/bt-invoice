import { useState, useCallback, useEffect, Fragment } from 'react';
import '../bds-tokens.css';
import { BdsButton, BdsBadge, BdsInput, BdsTextArea, BdsIcon } from '../bds';

/* ── Mock data ──
 * Allowances are grouped by vendor type (e.g. flooring, tile, plumbing).
 * Each option's `group` is the room/area within that vendor type
 * (e.g. "Kitchen flooring", "Master bath shower"). */
const selectionGroups = [
  {
    id: 'sel-1', name: 'Flooring', vendor: 'Cornerstone Flooring',
    allowance: 18500, dueDate: '2026-04-15', status: 'overdue' as const,
    description: 'Pick flooring for each room. Your flooring vendor offers hardwood, vinyl plank, laminate, and carpet — choose what fits each space.',
    options: [
      // Kitchen flooring
      { id: 'fl-k1', name: 'Lifeproof Vinyl Plank — Dusk Cherry', vendor: 'Lifeproof', price: 3200, image: 'https://images.thdstatic.com/productImages/eb9b442d-4536-470d-81e4-f1bea67caf9d/svn/dusk-cherry-lifeproof-vinyl-plank-flooring-i06204lp-64_600.jpg', selected: false, group: 'Kitchen flooring', tier: 'base' as const },
      { id: 'fl-k2', name: 'Shaw Natural Classics — White Oak', vendor: 'Shaw Floors', price: 4800, image: 'https://shawfloors.widen.net/content/maw31txwtx/jpeg/sw774_01147_main', selected: false, group: 'Kitchen flooring', tier: 'upgrade' as const },
      // Living + dining flooring
      { id: 'fl-l1', name: 'TrafficMaster Laminate — Lakeshore Pecan', vendor: 'TrafficMaster', price: 2400, image: 'https://images.thdstatic.com/productImages/a08ca173-0a82-4dbe-90fb-7bdd3e8309a7/svn/lakeshore-pecan-stone-trafficmaster-laminate-wood-flooring-50560-77_600.jpg', selected: false, group: 'Living + dining flooring', tier: 'base' as const },
      { id: 'fl-l2', name: 'Bruce Solid Hardwood — Butterscotch Oak', vendor: 'Bruce', price: 5800, image: 'https://images.thdstatic.com/productImages/c29747ad-e373-456b-8cdd-fc380f7fd554/svn/butterscotch-bruce-solid-hardwood-ahs626-64_1000.jpg', selected: false, group: 'Living + dining flooring', tier: 'upgrade' as const },
      // Bedroom flooring — consolidated for all bedrooms (master + bedrooms 2 & 3)
      { id: 'fl-m1', name: 'Mohawk Plush Carpet — Sandstone', vendor: 'Mohawk', price: 1600, image: 'https://cdn11.bigcommerce.com/s-2d2cb/images/stencil/1280x1280/products/74638/189074/28326_00__21267.1668113654.jpg?c=2?imbypass=on', images: ['https://cdn11.bigcommerce.com/s-2d2cb/images/stencil/1280x1280/products/74638/189074/28326_00__21267.1668113654.jpg?c=2?imbypass=on', 'https://cdn11.bigcommerce.com/s-2d2cb/images/stencil/728x728/products/74638/189073/O_28326_958_mindful__35970.1668113650.jpg?c=2'], selected: false, group: 'Bedroom flooring', tier: 'base' as const },
      { id: 'fl-m2', name: 'Stainmaster Berber Carpet — Driftwood', vendor: 'Stainmaster', price: 2300, image: 'https://mobileimages.lowes.com/productimages/fe119674-3be7-4753-ab30-ac78df03cf27/72813536.jpeg', images: ['https://mobileimages.lowes.com/productimages/fe119674-3be7-4753-ab30-ac78df03cf27/72813536.jpeg', 'https://mobileimages.lowes.com/product/converted/840712/840712114608.jpg?size=pdhism'], selected: false, group: 'Bedroom flooring', tier: 'upgrade' as const },
      { id: 'fl-b1', name: 'Mohawk Plush Carpet — Mineral Beige', vendor: 'Mohawk', price: 1300, image: 'https://s7d4.scene7.com/is/image/MohawkResidential/28989_743_room_02?scl=2&op_sharpen=1', images: ['https://s7d4.scene7.com/is/image/MohawkResidential/28989_743_room_02?scl=2&op_sharpen=1', 'https://cdn11.bigcommerce.com/s-2d2cb/images/stencil/728x728/products/75581/192373/2P40-518_Hearth_Beige__79900.1682089402.jpg?c=2'], selected: false, group: 'Bedroom flooring', tier: 'base' as const },
    ],
  },
  // Packaged selection — Good / Better / Best bundles where each option is a coordinated set
  {
    id: 'sel-pkg-bath', name: 'Master bath package', vendor: 'Allied Bath Collections',
    allowance: 8000, dueDate: '2026-04-26', status: 'overdue' as const,
    description: 'Choose a coordinated bath package — fixtures, fittings, and accessories from a single collection. Approving a package locks in all items as a set.',
    options: [
      {
        id: 'pkg-bath-good', name: 'Good — Essentials', vendor: 'Moen Essentials',
        price: 4400, image: 'https://images.thdstatic.com/productImages/a96c1819-3c0e-4dea-bf0c-ead6d07eb686/svn/chrome-moen-bathtub-shower-faucet-combos-82603-64_1000.jpg',
        selected: false, group: 'Master bath package', tier: 'base' as const,
      },
      {
        id: 'pkg-bath-better', name: 'Better — Curated', vendor: 'Delta Curated',
        price: 6200, image: 'https://m.media-amazon.com/images/I/71FK1buvW+L.jpg',
        selected: false, group: 'Master bath package', tier: 'upgrade' as const,
      },
      {
        id: 'pkg-bath-best', name: 'Best — Designer', vendor: 'Kohler Designer',
        price: 8400, image: 'https://images.thdstatic.com/productImages/d9b0b956-0169-4319-ad0e-f96098bc1fcc/svn/white-kohler-farmhouse-kitchen-sinks-k-28668-0-e1_600.jpg',
        selected: false, group: 'Master bath package', tier: 'upgrade' as const,
      },
    ],
  },
  {
    id: 'sel-2', name: 'Tile', vendor: 'Premier Tile & Stone',
    allowance: 9500, dueDate: '2026-05-01', status: 'action_needed' as const,
    description: 'Choose tile for backsplashes, shower walls, and bath floors. The same vendor supplies all tile so styles can be coordinated.',
    options: [
      // Kitchen backsplash
      { id: 'tl-k1', name: 'White Subway Tile Backsplash', vendor: 'Merola Tile', price: 620, image: 'https://images.thdstatic.com/productImages/502e06ba-dcea-4c4b-b2f0-5cc5a55a2704/svn/glossy-white-merola-tile-ceramic-tile-web3chgw-64_600.jpg', selected: false, group: 'Kitchen backsplash', tier: 'base' as const },
      { id: 'tl-k2', name: 'Marble Hexagon Backsplash', vendor: 'TileBar', price: 950, image: 'https://www.tileclub.com/cdn/shop/files/carrara-hexagon-tile-backsplash-2.jpg?v=1723504600', selected: false, group: 'Kitchen backsplash', tier: 'upgrade' as const },
      // Master bath floor
      { id: 'tl-mbf1', name: 'Porcelain Hex Tile — White', vendor: 'Merola Tile', price: 2200, image: 'https://images.thdstatic.com/productImages/356a61c1-2e11-4f60-8b64-1b35ad5f289b/svn/white-medium-sheen-merola-tile-porcelain-tile-fcd10wtx-e1_600.jpg', selected: false, group: 'Master bath floor', tier: 'base' as const },
      { id: 'tl-mbf2', name: 'Carrara White Marble Floor Tile', vendor: 'TileBar', price: 2800, image: 'https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcSGYKPyoe2Rzl-1bS94z9jjJrgknQCps5Ce5qwPPfI0-R7MOIqopooLat3pDoWs2LmGHx0WEc3lGD93Gy0TnSnoFvsEsSami58-o4SCkcg0n9cgZLY_fdtC4w', selected: false, group: 'Master bath floor', tier: 'upgrade' as const },
      { id: 'tl-mbf3', name: 'Daltile Porcelain — Concrete Look Gray', vendor: 'Daltile', price: 1900, image: 'https://www.mineraltiles.com/cdn/shop/files/florence-calacatta-gold-porcelain-tile-39x39.jpg?v=1712084519&width=1150', selected: false, group: 'Master bath floor', tier: 'base' as const },
      // Master bath shower
      { id: 'tl-s1', name: 'Glossy White Subway Tile', vendor: 'Merola Tile', price: 1200, image: 'https://images.thdstatic.com/productImages/502e06ba-dcea-4c4b-b2f0-5cc5a55a2704/svn/glossy-white-merola-tile-ceramic-tile-web3chgw-64_600.jpg', selected: false, group: 'Master bath shower', tier: 'base' as const },
      { id: 'tl-s2', name: 'Penny Round Mosaic — Matte White', vendor: 'Merola Tile', price: 980, image: 'https://m.media-amazon.com/images/I/51u37UdURlL._AC_UF350,350_QL80_.jpg', selected: false, group: 'Master bath shower', tier: 'base' as const },
      { id: 'tl-s3', name: 'Herringbone Marble Mosaic', vendor: 'TileBar', price: 1800, image: 'https://www.stonecenteronline.com/media/catalog/product/cache/f77b4f15034ebe734bb6931a52e0b5ed/c/7/c72xh-carrara-white-marble-1x3-herringbone-mosaic-tile-honed.jpg', selected: false, group: 'Master bath shower', tier: 'upgrade' as const },
      { id: 'tl-s4', name: 'Arabesque Lantern Mosaic — White', vendor: 'MSI', price: 1450, image: 'https://images.thdstatic.com/productImages/342247dc-6a7d-47d3-ad33-2e140184c3fe/svn/carrara-white-glass-tile-mabq-whi-10-4f_600.jpg', selected: false, group: 'Master bath shower', tier: 'upgrade' as const },
      // Powder room floor
      { id: 'tl-p1', name: 'Large Format Porcelain — Calacatta', vendor: 'Daltile', price: 750, image: 'https://www.mineraltiles.com/cdn/shop/files/florence-calacatta-gold-porcelain-tile-39x39.jpg?v=1712084519&width=1150', selected: false, group: 'Powder room floor', tier: 'base' as const },
      { id: 'tl-p2', name: 'Basketweave Marble Mosaic', vendor: 'Jeffrey Court', price: 950, image: 'https://m.media-amazon.com/images/I/71ptOTYeLGL._AC_UF894,1000_QL80_.jpg', selected: false, group: 'Powder room floor', tier: 'upgrade' as const },
    ],
  },
  {
    id: 'sel-3', name: 'Plumbing fixtures', vendor: 'Ferguson Plumbing Supply',
    allowance: 5800, dueDate: '2026-05-15', status: 'pending' as const,
    description: 'Pick faucets and sinks for the kitchen and baths. All fixtures come from the same supplier so finishes can match.',
    options: [
      // Kitchen sink
      { id: 'pl-ks1', name: 'Kraus Bellucci Undermount Sink', vendor: 'Kraus', price: 1890, image: 'https://images.thdstatic.com/productImages/fe4a0711-acbe-565f-bafa-1c99f5efca67/svn/metallic-black-kraus-undermount-kitchen-sinks-kguw2-33mbl-e1_600.jpg', selected: false, group: 'Kitchen sink', tier: 'base' as const, url: 'https://www.homedepot.com/p/KRAUS-Bellucci-White-Granite-Composite-32-in-Single-Bowl-Undermount-Workstation-Kitchen-Sink-with-WasteGuard-Garbage-Disposal-KGUW1-33WH-100-75MB/319044830' },
      { id: 'pl-ks2', name: 'Kohler Elmbrook Farmhouse Sink', vendor: 'Kohler', price: 2160, image: 'https://images.thdstatic.com/productImages/d9b0b956-0169-4319-ad0e-f96098bc1fcc/svn/white-kohler-farmhouse-kitchen-sinks-k-28668-0-e1_600.jpg', images: ['https://images.thdstatic.com/productImages/d9b0b956-0169-4319-ad0e-f96098bc1fcc/svn/white-kohler-farmhouse-kitchen-sinks-k-28668-0-e1_600.jpg', 'https://images.thdstatic.com/productImages/ee9fa0be-2001-480b-852c-bc1cd926941c/svn/white-kohler-farmhouse-kitchen-sinks-k-28668-0-77_600.jpg', 'https://photos-us.bazaarvoice.com/photo/2/cGhvdG86aG9tZWRlcG90/dca91f51-7570-55e9-9033-b407853daf71'], selected: false, group: 'Kitchen sink', tier: 'upgrade' as const, url: 'https://www.homedepot.com/p/KOHLER-Elmbrook-Cast-Iron-33-in-Single-Bowl-Farmhouse-Apron-Front-Kitchen-Sink-in-White-K-28668-0/316246054' },
      // Kitchen faucet
      { id: 'pl-kf1', name: 'Moen Arbor MotionSense — Stainless', vendor: 'Moen', price: 650, image: 'https://m.media-amazon.com/images/I/81Tdwh-vFUL.jpg', images: ['https://m.media-amazon.com/images/I/81Tdwh-vFUL.jpg', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQp_5oxh0J8UiRFoPUZjhkoDNurftH-7n96IQ&s'], selected: false, group: 'Kitchen faucet', tier: 'base' as const, url: 'https://www.homedepot.com/p/MOEN-Arbor-Single-Handle-Pull-Down-Sprayer-Kitchen-Faucet-with-Power-Boost-in-Spot-Resist-Stainless-7594SRS/204725308' },
      { id: 'pl-kf2', name: 'Delta Kylo Touchless Faucet — Black', vendor: 'Delta', price: 780, image: 'https://mobileimages.lowes.com/productimages/b9f5b84c-5ac7-417f-aa2c-4ba4131f2aa7/69082796.jpeg', images: ['https://mobileimages.lowes.com/productimages/b9f5b84c-5ac7-417f-aa2c-4ba4131f2aa7/69082796.jpeg', 'https://mobileimages.lowes.com/productimages/aaa2b119-847d-4b26-9417-06db97eabd42/68533231.jpeg'], selected: false, group: 'Kitchen faucet', tier: 'upgrade' as const, url: 'https://www.lowes.com/pd/Delta-Kylo-Matte-Black-Single-Handle-Pull-down-Touchless-Kitchen-Faucet-with-Sprayer-Deck-Plate-Included/5015280915' },
      // Master bath faucet
      { id: 'pl-mf1', name: 'Moen Genta Widespread Faucet — Chrome', vendor: 'Moen', price: 220, image: 'https://i5.walmartimages.com/asr/2c09fd8c-ec91-4a78-83fa-557358b60258.414e80629804f3b1daa9c5e2ad64ac85.jpeg?odnHeight=768&odnWidth=768&odnBg=FFFFFF', images: ['https://i5.walmartimages.com/asr/2c09fd8c-ec91-4a78-83fa-557358b60258.414e80629804f3b1daa9c5e2ad64ac85.jpeg?odnHeight=768&odnWidth=768&odnBg=FFFFFF', 'https://m.media-amazon.com/images/I/51U94S9iZSL._AC_UF894,1000_QL80_.jpg'], selected: false, group: 'Master bath faucet', tier: 'base' as const },
      { id: 'pl-mf2', name: 'Delta Trinsic Widespread — Matte Black', vendor: 'Delta', price: 380, image: 'https://m.media-amazon.com/images/I/71FK1buvW+L.jpg', images: ['https://m.media-amazon.com/images/I/71FK1buvW+L.jpg', 'https://mobileimages.lowes.com/productimages/f20254d5-1a4c-4d26-ab42-2ec59bfd4b16/65299559.png?size=pdhz'], selected: false, group: 'Master bath faucet', tier: 'upgrade' as const },
      // Master bath shower trim
      { id: 'pl-ms1', name: 'Moen Adler Tub & Shower Trim — Chrome', vendor: 'Moen', price: 280, image: 'https://images.thdstatic.com/productImages/a96c1819-3c0e-4dea-bf0c-ead6d07eb686/svn/chrome-moen-bathtub-shower-faucet-combos-82603-64_1000.jpg', selected: false, group: 'Master bath shower trim', tier: 'base' as const },
      { id: 'pl-ms2', name: 'Delta Trinsic Rain Shower System — Black', vendor: 'Delta', price: 540, image: 'https://faucetlist.com/cdn/shop/products/SS1459BL1_2000x.jpg?v=1621372139', selected: false, group: 'Master bath shower trim', tier: 'upgrade' as const },
    ],
  },
  {
    id: 'sel-4', name: 'Countertops & cabinetry', vendor: 'Allied Cabinets & Stone',
    allowance: 9200, dueDate: '2026-05-20', status: 'pending' as const,
    description: 'Pick countertop materials and vanity finishes. Cabinets and stone are fabricated by the same shop.',
    options: [
      // Kitchen countertop
      { id: 'cb-kc1', name: 'Granite Countertop — White Ice', vendor: 'MSI', price: 2800, image: 'https://cabinetmakerwarehouse.com/cdn/shop/files/Formica-9476-White-Ice-Granite-Traditiona-Kitchen-scaled.jpg?v=1717089142&width=1080', selected: false, group: 'Kitchen countertop', tier: 'base' as const },
      { id: 'cb-kc2', name: 'Quartz Countertop — Calacatta Laza', vendor: 'MSI', price: 3200, image: 'https://cdn.msisurfaces.com/images/quartz-countertops/products/roomscenes/large/calacatta-laza-quartz-4.jpg', selected: false, group: 'Kitchen countertop', tier: 'upgrade' as const },
      // Master bath vanity
      { id: 'cb-mv1', name: 'Double Vanity — 60" White Shaker', vendor: 'Home Decorators', price: 1850, image: 'https://m.media-amazon.com/images/I/81esKlRUTpL._AC_UF894,1000_QL80_.jpg', selected: false, group: 'Master bath vanity', tier: 'base' as const },
      { id: 'cb-mv2', name: 'Double Vanity — 60" Espresso w/ Quartz Top', vendor: 'Home Decorators', price: 2650, image: 'https://whalenfurniture.com/wp-content/uploads/2023/09/60in-Estehaus-Vanity_SL60EHV.jpg', selected: false, group: 'Master bath vanity', tier: 'upgrade' as const },
      // Master bath mirror
      { id: 'cb-mm1', name: 'Frameless LED Mirror — 36" Round', vendor: 'TOOLKISS', price: 320, image: 'https://m.media-amazon.com/images/I/71uP4Hcb4jL.jpg', selected: false, group: 'Master bath mirror', tier: 'base' as const },
    ],
  },
  {
    id: 'sel-5', name: 'Appliances', vendor: 'Capitol Appliance Co.',
    allowance: 2400, dueDate: '2026-06-01', status: 'pending' as const,
    description: 'Pick your kitchen appliances. The package is sourced through your appliance vendor.',
    options: [
      { id: 'ap-d1', name: 'GE Profile Dishwasher', vendor: 'GE Appliances', price: 1079, image: 'https://reviewed-com-res.cloudinary.com/image/fetch/s--1szEEAgv--/b_white,c_limit,cs_srgb,f_auto,fl_progressive.strip_profile,g_center,q_auto,w_1200/https://reviewed-production.s3.amazonaws.com/1662062743549/114647_Profile_Dish_CoBranding_2400x2500_1.jpeg', selected: false, group: 'Kitchen dishwasher', tier: 'base' as const, url: 'https://www.homedepot.com/p/GE-Profile-24-in-Smart-Built-In-Top-Control-45-dBA-Fingerprint-Resistant-Stainless-Dishwasher-with-Microban-Technology-PDT705SYWFS/331066211' },
      { id: 'ap-d2', name: 'Bosch 500 Series Dishwasher', vendor: 'Bosch', price: 1349, image: 'https://us.bosch-press.com/pressportal/us/media/dam_images_us/pi266_usus/shp65dm5n_lifestyleimage_1_master.jpg', selected: false, group: 'Kitchen dishwasher', tier: 'upgrade' as const, url: 'https://www.homedepot.com/p/Bosch-500-Series-24-in-Stainless-Steel-Top-Control-Tall-Tub-Pocket-Handle-Dishwasher-with-Stainless-Steel-Tub-Quiet-44-dBA-SHP65CM5N/325602597' },
    ],
  },
  {
    id: 'sel-6', name: 'Lighting', vendor: 'Capitol Lighting',
    allowance: 6000, dueDate: '2026-04-20', status: 'approved' as const,
    description: 'Your builder has reviewed and confirmed your lighting choices. These are locked in for your project.',
    options: [
      { id: 'lt-1', name: 'Modern Chandelier — Dining', vendor: 'West Elm', price: 2400, image: 'https://images.thdstatic.com/productImages/10674fff-fe26-4bfd-b382-b9d2f4ffe230/svn/matte-gold-26-lnc-chandeliers-nbbfbzhd1362236-e4_600.jpg', selected: true, group: 'Dining chandelier', tier: 'upgrade' as const },
      { id: 'lt-2', name: 'Recessed Lighting (8x)', vendor: 'Commercial Electric', price: 1920, image: 'https://images.thdstatic.com/productImages/b9e47a4d-a64c-4755-90eb-3cebd7d8b345/svn/white-commercial-electric-recessed-lighting-retrofit-trims-ns01da09fr2-259-1d_1000.jpg', selected: true, group: 'Whole-house recessed', tier: 'base' as const },
      { id: 'lt-3', name: 'Pendant Lights — Kitchen Island (3x)', vendor: 'Hukoro', price: 1350, image: 'https://images.thdstatic.com/productImages/ba4f0ae8-66d7-4ba0-8767-2482a5886153/svn/black-henveton-pendant-lights-ylc900504-1b-e1_1000.jpg', selected: true, group: 'Kitchen pendants', tier: 'base' as const },
    ],
  },
];

// Package-only option detail — items list keyed by option id. Kept outside the
// strictly-typed selectionGroups array so the rest of the code stays inferred.
const packageItems: Record<string, { name: string; qty: number; unit: string; price: number }[]> = {
  'pkg-bath-good': [
    { name: 'Vanity faucet — Chrome', qty: 2, unit: 'ea', price: 220 },
    { name: 'Shower trim & valve — Chrome', qty: 1, unit: 'ea', price: 280 },
    { name: 'Toilet — Round front', qty: 1, unit: 'ea', price: 380 },
    { name: 'Towel bars (24") + ring + hook', qty: 1, unit: 'set', price: 140 },
    { name: 'Bath accessories — Chrome', qty: 1, unit: 'set', price: 160 },
    { name: 'Installation labor', qty: 1, unit: 'lot', price: 3000 },
  ],
  'pkg-bath-better': [
    { name: 'Vanity faucet — Matte black widespread', qty: 2, unit: 'ea', price: 380 },
    { name: 'Shower trim, valve & rain head', qty: 1, unit: 'set', price: 540 },
    { name: 'Toilet — One-piece elongated', qty: 1, unit: 'ea', price: 680 },
    { name: 'Heated towel rack', qty: 1, unit: 'ea', price: 320 },
    { name: 'Bath accessories — Matte black set', qty: 1, unit: 'set', price: 240 },
    { name: 'Installation labor', qty: 1, unit: 'lot', price: 3300 },
  ],
  'pkg-bath-best': [
    { name: 'Vanity faucet — Brushed brass widespread', qty: 2, unit: 'ea', price: 620 },
    { name: 'Smart shower system w/ rain + body sprays', qty: 1, unit: 'set', price: 1280 },
    { name: 'Toilet — Smart bidet seat', qty: 1, unit: 'ea', price: 1400 },
    { name: 'Heated towel rack — Brushed brass', qty: 1, unit: 'ea', price: 480 },
    { name: 'Bath accessories — Designer set', qty: 1, unit: 'set', price: 420 },
    { name: 'Installation labor', qty: 1, unit: 'lot', price: 3800 },
  ],
};

const statusConfig = {
  overdue: { label: 'Overdue', color: '#B5254C', bg: '#FFEEEA' },
  action_needed: { label: 'Action needed', color: '#854D00', bg: '#FDF3D3' },
  pending: { label: 'Not started', color: '#4E555F', bg: '#F1F4FA' },
  approved: { label: 'Approved', color: '#057E4B', bg: '#DDFDEF' },
  ready: { label: 'Ready to submit', color: '#057E4B', bg: '#DDFDEF' },
  in_progress: { label: 'In progress', color: '#004FD6', bg: '#E6F6FF' },
};

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function daysUntil(dateStr: string) {
  const diff = Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `${Math.abs(diff)} days overdue`;
  if (diff === 0) return 'Due today';
  if (diff === 1) return 'Due tomorrow';
  return `${diff} days`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ── Swipe Selection Mode ── */
function SwipeMode({ group, onDone, onToggle, onViewImage }: {
  group: typeof selectionGroups[0];
  onDone: () => void;
  onToggle: (optId: string) => void;
  onViewImage?: (src: string, name: string) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [swipeDir, setSwipeDir] = useState<'left' | 'right' | null>(null);
  const [history, setHistory] = useState<{ optId: string; action: 'add' | 'skip' | 'decline' }[]>([]);

  const selectedSoFar = group.options.filter(o => o.selected).reduce((s, o) => s + o.price, 0);
  const opt = group.options[idx];
  const isLast = idx >= group.options.length;

  const [, setDeclined] = useState<Set<string>>(new Set());

  const handleAction = useCallback((action: 'add' | 'decline' | 'skip') => {
    if (!opt) return;
    if (action === 'skip') {
      setDeclined(prev => new Set(prev).add(opt.id));
    }
    setSwipeDir(action === 'add' ? 'right' : 'left');
    setHistory(prev => [...prev, { optId: opt.id, action }]);
    if (action === 'add' && !opt.selected) onToggle(opt.id);
    if (action === 'decline' && opt.selected) onToggle(opt.id);
    setTimeout(() => {
      setSwipeDir(null);
      setIdx(i => i + 1);
    }, 250);
  }, [opt, onToggle]);

  const handleUndo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    onToggle(last.optId);
    setIdx(i => i - 1);
  };

  const remainingIfAdded = opt ? group.allowance - selectedSoFar - (opt.selected ? 0 : opt.price) : 0;

  if (isLast) {
    const finalTotal = group.options.filter(o => o.selected).reduce((s, o) => s + o.price, 0);
    const finalDiff = group.allowance - finalTotal;
    return (
      <div className="sw-overlay">
        <div className="sw-container sw-review">
          <div className="sw-review-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#DDFDEF"/><path d="M7 12.5l3 3 7-7" stroke="#057E4B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <h2 className="sw-review-title">Review your selections</h2>
          <p className="sw-review-sub">{group.name}</p>

          <div className="sw-review-items">
            {group.options.map(o => (
              <div key={o.id} className={`sw-review-item ${o.selected ? 'sw-review-item-on' : 'sw-review-item-off'}`} onClick={() => onToggle(o.id)}>
                <div className="sw-review-item-left">
                  {o.selected ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#057E4B"/><path d="M8 12l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#DEE3EB" strokeWidth="2"/></svg>
                  )}
                  <span style={{ textDecoration: o.selected ? 'none' : 'line-through', opacity: o.selected ? 1 : 0.5 }}>{o.name}</span>
                </div>
                <span style={{ opacity: o.selected ? 1 : 0.5 }}>${fmt(o.price)}</span>
              </div>
            ))}
          </div>

          <div className="sw-review-summary">
            <div className="sw-review-row"><span>Allowance</span><span>${fmt(group.allowance)}</span></div>
            <div className="sw-review-row"><span>Selected</span><span>-${fmt(finalTotal)}</span></div>
            <div className={`sw-review-row sw-review-total ${finalDiff < 0 ? 'cs-over' : 'cs-under'}`}>
              <span>{finalDiff >= 0 ? 'Remaining' : 'Overage'}</span>
              <span>{finalDiff < 0 ? '+' : ''}${fmt(Math.abs(finalDiff))}</span>
            </div>
          </div>

          <div className="sw-review-actions">
            <BdsButton text="Submit choices" displayType="primary" onClick={onDone} />
            <BdsButton text="Save and go back" displayType="tertiary" onClick={onDone} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sw-overlay">
      <div className="sw-container">
        {/* Top bar */}
        <div className="sw-topbar">
          <button className="sw-close" onClick={onDone}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div className="sw-progress">
            <span className="sw-progress-text">{idx + 1} of {group.options.length}</span>
            <div className="sw-progress-bar">
              <div className="sw-progress-fill" style={{ width: `${((idx + 1) / group.options.length) * 100}%` }} />
            </div>
          </div>
          <div className="sw-budget-pill">
            <span className="sw-budget-label">Budget left</span>
            <span className={`sw-budget-amt ${selectedSoFar > group.allowance ? 'cs-over' : ''}`}>${fmt(group.allowance - selectedSoFar)}</span>
          </div>
        </div>

        {/* Card */}
        <div className={`sw-card ${swipeDir === 'right' ? 'sw-card-right' : ''} ${swipeDir === 'left' ? 'sw-card-left' : ''}`}>
          {opt.image ? (
            <div className="sw-card-img" style={{ backgroundImage: `url(${opt.image})`, cursor: 'zoom-in' }} onClick={() => onViewImage?.(opt.image, opt.name)}>
              <button className="sw-zoom-btn" onClick={(e) => { e.stopPropagation(); onViewImage?.(opt.image, opt.name); }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              </button>
            </div>
          ) : (
            <div className="sw-card-img sw-card-img-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C7D0D9" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            </div>
          )}
          <div className="sw-card-body">
            <div className="sw-card-vendor">{opt.vendor}</div>
            <div className="sw-card-name">{opt.name}</div>
            <div className="sw-card-price">${fmt(opt.price)}</div>
            <div className={`sw-card-impact ${remainingIfAdded < 0 ? 'cs-over' : ''}`}>
              {!opt.selected
                ? remainingIfAdded >= 0
                  ? `$${fmt(remainingIfAdded)} remaining if you add this`
                  : `$${fmt(Math.abs(remainingIfAdded))} over budget if you add this`
                : 'Currently in your selections'
              }
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="sw-actions">
          <div className="sw-action-col">
            <button className="sw-btn sw-btn-decline" onClick={() => handleAction('decline')} title="Skip">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <span className="sw-action-label sw-hint-decline">Decline</span>
          </div>
          <div className="sw-action-col">
            <button className="sw-btn sw-btn-skip" onClick={() => handleAction('skip')} title="Skip for now">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
            <span className="sw-action-label">Skip</span>
          </div>
          {history.length > 0 && (
            <div className="sw-action-col">
              <button className="sw-btn sw-btn-undo" onClick={handleUndo} title="Undo">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
              </button>
              <span className="sw-action-label">Undo</span>
            </div>
          )}
          <div className="sw-action-col">
            <button className="sw-btn sw-btn-add" onClick={() => handleAction('add')} title="Add to selections">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
            </button>
            <span className="sw-action-label sw-hint-add">Choose</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ── */
type Persona = 'prototype-bds';
const personaConfig: Record<Persona, { label: string; jobName: string; heroTitle: string; heroDesc: string; showAllowance: boolean; showTiers: boolean; showDelta: boolean; showForecast: boolean; pricingLabel: string }> = {
  'prototype-bds': { label: 'Custom / Remodel', jobName: 'Johnson Residence — Full Remodel', heroTitle: 'Selections', heroDesc: 'Review and approve materials and finishes for your project. Your allowance budget is shown for each category.', showAllowance: true, showTiers: false, showDelta: false, showForecast: false, pricingLabel: 'Approved price' },
};

export default function ClientSelections() {
  const [persona] = useState<Persona>('prototype-bds');
  const pc = personaConfig[persona];
  const isPrototype = persona === 'prototype-bds';
  const isBds = true;
  const [approvedExpanded, setApprovedExpanded] = useState(false);
  const [favoritedOptions, setFavoritedOptions] = useState<Set<string>>(new Set([
    'fl-l2', 'fl-mb1',
    'tl-s3',
    'pl-mf2', 'pl-kf2',
    'cb-mv2',
    'ap-d2',
  ]));
  const [hasInteracted, setHasInteracted] = useState(false);
  const toggleFavorite = (optId: string) => {
    setHasInteracted(true);
    setFavoritedOptions(prev => {
      const n = new Set(prev);
      if (n.has(optId)) n.delete(optId); else n.add(optId);
      return n;
    });
  };
  const [linkFetching, setLinkFetching] = useState<Record<string, boolean>>({});
  const [imageFromLink, setImageFromLink] = useState<Record<string, boolean>>({});
  const fetchImageFromLink = async (gid: string, url: string) => {
    if (!url.trim() || !/^https?:\/\//i.test(url)) return;
    setLinkFetching(prev => ({ ...prev, [gid]: true }));
    try {
      const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
      const json = await res.json();
      const imgUrl = json?.data?.image?.url;
      if (imgUrl) {
        const wasFromLink = imageFromLink[gid] || false;
        setRequestImages(prev => {
          const cur = prev[gid] || [];
          const next = wasFromLink && cur.length > 0 ? [imgUrl, ...cur.slice(1)] : [imgUrl, ...cur];
          return { ...prev, [gid]: next };
        });
        setImageFromLink(prev => ({ ...prev, [gid]: true }));
      }
    } catch (e) {
      // Silent fail — user can still add a manual photo
    } finally {
      setLinkFetching(prev => ({ ...prev, [gid]: false }));
    }
  };
  const resetRequest = (gid: string) => {
    setOpenRequestGroups(prev => { const n = new Set(prev); n.delete(gid); return n; });
    setRequestText(prev => { const { [gid]: _, ...rest } = prev; return rest; });
    setRequestLink(prev => { const { [gid]: _, ...rest } = prev; return rest; });
    setRequestImages(prev => { const { [gid]: _, ...rest } = prev; return rest; });
    setImageFromLink(prev => { const { [gid]: _, ...rest } = prev; return rest; });
    setLinkFetching(prev => { const { [gid]: _, ...rest } = prev; return rest; });
  };
  const submitRequest = (gid: string) => {
    const text = (requestText[gid] || '').trim();
    const link = (requestLink[gid] || '').trim();
    const images = requestImages[gid] || [];
    if (!gid || !text) return;
    if (!link) {
      showToast('Add a product link to send the request');
      return;
    }
    setRequestedGroups(prev => new Set(prev).add(gid));
    const newReq = { groupId: gid, text, link, images, autoApprove: false, date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
    setRequests(prev => {
      const sameGroup = prev.findIndex(r => r.groupId === gid);
      if (sameGroup >= 0) {
        const updated = [...prev];
        updated[sameGroup] = newReq;
        return updated;
      }
      return [...prev, newReq];
    });
    showToast('Request sent — your builder will review it');
    resetRequest(gid);
  };
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const [expandedId] = useState<string | null>(null);
  const [selections, setSelections] = useState(selectionGroups);
  const [filter, setFilter] = useState<'all' | 'action' | 'approved' | 'favorites'>('all');
  const [swipeGroupId, setSwipeGroupId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  const [lightboxImg, setLightboxImg] = useState<{images: string[]; name: string; index: number; url?: string} | null>(null);
  const [detailItem, setDetailItem] = useState<{ groupId: string; optionId: string } | null>(null);
  const [modalImgIdx, setModalImgIdx] = useState(0);
  const [commentsPanelOpen, setCommentsPanelOpen] = useState(false);
  const [compareSet, setCompareSet] = useState<Set<string>>(new Set());
  const [showCompare, setShowCompare] = useState(false);
  useEffect(() => { setModalImgIdx(0); }, [detailItem?.optionId]);
  const toggleCompare = (optId: string) => {
    setCompareSet(prev => {
      const n = new Set(prev);
      if (n.has(optId)) n.delete(optId);
      else if (n.size >= 4) { showToast('Compare up to 4 items at a time'); return prev; }
      else n.add(optId);
      return n;
    });
  };
  type OptionMessage = { id: string; from: 'client' | 'builder'; text: string; ts: string };
  const [optionMessages, setOptionMessages] = useState<Record<string, OptionMessage[]>>({
    'fl-l2': [
      { id: 'm-1', from: 'builder', text: 'This one will need a 7–10 day lead time. Let me know and we can confirm with the supplier.', ts: 'Apr 22' },
    ],
  });
  const [draftMessage, setDraftMessage] = useState('');
  const [openRequestGroups, setOpenRequestGroups] = useState<Set<string>>(new Set());
  const [requestText, setRequestText] = useState<Record<string, string>>({});
  const [requestLink, setRequestLink] = useState<Record<string, string>>({});
  const [requestImages, setRequestImages] = useState<Record<string, string[]>>({});
  const [, setAutoApprove] = useState(true);
  const [submittedGroups, setSubmittedGroups] = useState<Set<string>>(new Set());
  const [declinedOptions, setDeclinedOptions] = useState<Set<string>>(new Set());
  const [cardImgIndex, setCardImgIndex] = useState<Record<string, number>>({});
  const [showDeclined, setShowDeclined] = useState<Set<string>>(new Set());
  const [, setRequestedGroups] = useState<Set<string>>(new Set());
  const [requests, setRequests] = useState<{groupId: string; text: string; link: string; images: string[]; autoApprove: boolean; date: string}[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);


  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Load saved progress on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('client-selections-progress-v3');
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved.selections) setSelections(saved.selections);
      if (saved.declinedOptions) setDeclinedOptions(new Set(saved.declinedOptions));
      if (saved.submittedGroups) setSubmittedGroups(new Set(saved.submittedGroups));
      if (saved.requests) setRequests(saved.requests);
    } catch (e) {
      console.warn('Failed to load saved selections', e);
    }
  }, []);

  const handleSaveProgress = () => {
    try {
      localStorage.setItem('client-selections-progress-v3', JSON.stringify({
        selections,
        declinedOptions: Array.from(declinedOptions),
        submittedGroups: Array.from(submittedGroups),
        requests,
      }));
      showToast('Selections saved');
    } catch (e) {
      showToast('Could not save — browser storage may be full');
    }
  };

  const declineOption = (optionId: string, groupId: string) => {
    setHasInteracted(true);
    if (submittedGroups.has(groupId)) {
      setSubmittedGroups(prev => { const n = new Set(prev); n.delete(groupId); return n; });
    }
    setDeclinedOptions(prev => new Set(prev).add(optionId));
    // Also deselect if it was selected
    setSelections(prev => prev.map(g =>
      g.id === groupId ? { ...g, options: g.options.map(o => o.id === optionId ? { ...o, selected: false } : o) } : g
    ));
  };

  const undeclineOption = (optionId: string) => {
    setHasInteracted(true);
    setDeclinedOptions(prev => { const n = new Set(prev); n.delete(optionId); return n; });
  };

  const toggleOption = (groupId: string, optionId: string) => {
    setHasInteracted(true);
    // Remove from submitted if user changes their mind
    if (submittedGroups.has(groupId)) {
      setSubmittedGroups(prev => { const n = new Set(prev); n.delete(groupId); return n; });
    }
    setSelections(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      const targetOpt = g.options.find(o => o.id === optionId);
      if (!targetOpt) return g;
      const isSelecting = !targetOpt.selected;
      const optGroup = (targetOpt as any).group;

      // Auto-decline siblings only for non-prototype personas (prototype allows multi-select)
      if (!isPrototype) {
        if (isSelecting && optGroup) {
          const siblings = g.options.filter(o => (o as any).group === optGroup && o.id !== optionId);
          const hasGroupSiblings = siblings.length > 0;
          if (hasGroupSiblings) {
            const newDeclined = new Set(declinedOptions);
            siblings.forEach(sib => newDeclined.add(sib.id));
            setDeclinedOptions(newDeclined);
            const declinedNames = siblings.map(s => s.name);
            if (declinedNames.length > 0) showToast(`${declinedNames.join(', ')} auto-declined`);
            return { ...g, options: g.options.map(o => {
              if (o.id === optionId) return { ...o, selected: true };
              if ((o as any).group === optGroup && o.id !== optionId) return { ...o, selected: false };
              return o;
            })};
          }
        }

        if (!isSelecting && optGroup) {
          const siblings = g.options.filter(o => (o as any).group === optGroup && o.id !== optionId);
          if (siblings.length > 0) {
            const newDeclined = new Set(declinedOptions);
            siblings.forEach(sib => newDeclined.delete(sib.id));
            setDeclinedOptions(newDeclined);
            const restoredNames = siblings.filter(s => declinedOptions.has(s.id)).map(s => s.name);
            if (restoredNames.length > 0) showToast(`${restoredNames.join(', ')} restored`);
          }
        }
      }

      // Remove from declined if re-selecting
      if (isSelecting && declinedOptions.has(optionId)) {
        setDeclinedOptions(prev => { const n = new Set(prev); n.delete(optionId); return n; });
      }

      return { ...g, options: g.options.map(o => o.id === optionId ? { ...o, selected: !o.selected } : o) };
    }));
  };

  // Calculate upgrade cost — only the delta above the base option counts against the allowance
  const getUpgradeCost = (group: typeof selectionGroups[0]) => {
    let cost = 0;
    const optGroups = new Map<string, any[]>();
    group.options.forEach(opt => {
      const g = (opt as any).group || opt.id;
      if (!optGroups.has(g)) optGroups.set(g, []);
      optGroups.get(g)!.push(opt);
    });
    optGroups.forEach((opts) => {
      const selected = opts.find(o => o.selected);
      if (!selected) return;
      if ((selected as any).tier === 'base') return; // no extra cost
      const baseOpt = opts.find(o => (o as any).tier === 'base');
      if (baseOpt) {
        cost += selected.price - baseOpt.price; // only the delta
      } else {
        cost += selected.price; // no base option exists, full price
      }
    });
    return cost;
  };

  const getSelectedTotal = (group: typeof selectionGroups[0]) => {
    return group.options.filter(o => o.selected).reduce((s, o) => s + o.price, 0);
  };

  const getDynamicStatus = (group: typeof selectionGroups[0]) => {
    if (group.status === 'approved') return 'approved';
    const anySelected = group.options.some(o => o.selected);
    if (isPrototype) {
      // Prototype: no "one per group" constraint — any selection counts as ready
      return anySelected ? 'ready' : group.status;
    }
    const optGroups = new Set(group.options.map(o => (o as any).group || o.id));
    const made = Array.from(optGroups).filter(g =>
      group.options.some(o => ((o as any).group || o.id) === g && o.selected)
    ).length;
    if (made === optGroups.size) return 'ready';
    if (made > 0) return 'in_progress';
    return group.status;
  };

  const dynamicStatuses = selections.map(g => getDynamicStatus(g));
  const actionCount = dynamicStatuses.filter(s => s === 'overdue' || s === 'action_needed').length;
  const readyCount = dynamicStatuses.filter(s => s === 'ready').length;
  const approvedCount = dynamicStatuses.filter(s => s === 'approved').length;
  const completedCount = approvedCount + readyCount;

  // Groups ready to submit (all choices made, not yet submitted or approved)
  const pendingSubmit = selections.filter((g, i) =>
    dynamicStatuses[i] === 'ready' &&
    !submittedGroups.has(g.id)
  );

  const handleSubmitAll = () => {
    setSelections(prev => prev.map(g => {
      if (pendingSubmit.some(p => p.id === g.id)) {
        return { ...g, status: 'approved' as const };
      }
      return g;
    }));
    showToast('Selections submitted.');
  };

  const sorted = [...selections].sort((a, b) => {
    const aApproved = a.status === 'approved' ? 1 : 0;
    const bApproved = b.status === 'approved' ? 1 : 0;
    return aApproved - bApproved;
  });

  const filtered = filter === 'all' ? sorted
    : filter === 'action' ? sorted.filter(s => { const ds = getDynamicStatus(s); return ds === 'overdue' || ds === 'action_needed' || ds === 'pending'; })
    : filter === 'favorites' ? sorted
        .filter(s => s.options.some(o => favoritedOptions.has(o.id)))
        .map(s => ({ ...s, options: s.options.filter(o => favoritedOptions.has(o.id)) }))
    : sorted.filter(s => { const ds = getDynamicStatus(s); return ds === 'approved' || ds === 'ready'; });

  const swipeGroup = selections.find(g => g.id === swipeGroupId);

  return (
    <>
      {swipeGroup && (
        <SwipeMode
          group={swipeGroup}
          onDone={() => setSwipeGroupId(null)}
          onToggle={(optId) => toggleOption(swipeGroup.id, optId)}
          onViewImage={(src, name) => setLightboxImg({images: [src], name, index: 0})/* swipe mode doesn't pass url */}
        />
      )}
      {/* Lightbox */}
      {lightboxImg && (
        <div className="sw-overlay lb-overlay" onClick={() => setLightboxImg(null)}>
          <button className="lb-close" onClick={() => setLightboxImg(null)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div className="lb-content" onClick={e => e.stopPropagation()}>
            <div className="lb-img-row">
              {lightboxImg.images.length > 1 && lightboxImg.index > 0 && (
                <button className="lb-arrow" onClick={() => setLightboxImg({...lightboxImg, index: lightboxImg.index - 1})}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
              )}
              <img src={lightboxImg.images[lightboxImg.index]} alt={lightboxImg.name} className="lb-img" />
              {lightboxImg.images.length > 1 && lightboxImg.index < lightboxImg.images.length - 1 && (
                <button className="lb-arrow" onClick={() => setLightboxImg({...lightboxImg, index: lightboxImg.index + 1})}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              )}
            </div>
            {lightboxImg.images.length > 1 && (
              <div className="lb-dots">
                {lightboxImg.images.map((_, i) => (
                  <button key={i} className={`lb-dot ${i === lightboxImg.index ? 'lb-dot-active' : ''}`} onClick={(e) => { e.stopPropagation(); setLightboxImg({...lightboxImg, index: i}); }} />
                ))}
              </div>
            )}
            {lightboxImg.url ? (
              <a className="lb-caption lb-caption-link" href={lightboxImg.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                {lightboxImg.name}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
            ) : (
              <div className="lb-caption">{lightboxImg.name}</div>
            )}
          </div>
        </div>
      )}

      {/* Desktop / Mobile preview toggle — fixed top-right of the viewport */}
      <div className="cs-preview-toggle" role="tablist" aria-label="Preview mode">
        <button
          type="button"
          className={`cs-preview-toggle-btn ${previewMode === 'desktop' ? 'cs-preview-toggle-btn-active' : ''}`}
          aria-pressed={previewMode === 'desktop'}
          onClick={() => setPreviewMode('desktop')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="13" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          Desktop
        </button>
        <button
          type="button"
          className={`cs-preview-toggle-btn ${previewMode === 'mobile' ? 'cs-preview-toggle-btn-active' : ''}`}
          aria-pressed={previewMode === 'mobile'}
          onClick={() => setPreviewMode('mobile')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="2" width="12" height="20" rx="2"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
          Mobile
        </button>
      </div>

      <div className={`cs-page ${isBds ? 'bds-scope bds-real-scope' : ''} ${previewMode === 'mobile' ? 'cs-page-mobile' : ''}`}>
        {/* Hero */}
        <div className="cs-hero">
          <h1 className="cs-hero-title">{pc.heroTitle}</h1>
        </div>



        <div className="cs-filters">
          <div className="cs-filter-left">
            <label className="cs-filter-select-wrap">
              <span className="cs-filter-select-label">Show</span>
              <select
                className="cs-filter-select"
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'action' | 'approved' | 'favorites')}
              >
                <option value="all">All categories ({selections.length})</option>
                <option value="action">Needs attention ({actionCount})</option>
                <option value="favorites">Favorites ({favoritedOptions.size})</option>
                <option value="approved">Completed ({completedCount})</option>
              </select>
            </label>
          </div>
          <div className="cs-view-toggle">
            <button className={`cs-view-btn ${viewMode === 'grid' ? 'cs-view-active' : ''}`} onClick={() => setViewMode('grid')} title="Card grid">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            </button>
            <button className={`cs-view-btn ${viewMode === 'compact' ? 'cs-view-active' : ''}`} onClick={() => setViewMode('compact')} title="Compact list">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div className="cs-cards">
          {(() => {
            const renderCard = (group: typeof selections[0]) => {
            const upgradeCost = getUpgradeCost(group);
            const selectedTotal = getSelectedTotal(group);
            const diff = group.allowance - selectedTotal;
            void expandedId; // keep state for swipe mode
            const dynamicStatus = getDynamicStatus(group);
            const sc = statusConfig[dynamicStatus as keyof typeof statusConfig];
            const dueDays = daysUntil(group.dueDate);
            const isOverdue = group.status === 'overdue';
            const optGroups = new Set(group.options.map(o => (o as any).group || o.id));
            const totalChoices = optGroups.size;
            const madeChoices = Array.from(optGroups).filter(g =>
              group.options.some(o => ((o as any).group || o.id) === g && o.selected)
            ).length;

            return (
              <div key={group.id} id={`cs-group-${group.id}`} className={`cs-section ${isOverdue ? 'cs-card-overdue' : ''}`}>
                {/* Section header */}
                <div className="cs-section-header">
                  <div className="cs-section-left">
                    <span className="cs-status-dot" style={{ background: sc.color }} />
                    <div className="cs-section-title-block">
                      <div className="cs-section-title-row">
                        <h3 className="cs-section-name">{group.name}</h3>
                        <BdsBadge
                          text={sc.label}
                          displayType={
                            dynamicStatus === 'overdue' ? 'danger'
                            : dynamicStatus === 'action_needed' ? 'warning'
                            : dynamicStatus === 'approved' || dynamicStatus === 'ready' ? 'success'
                            : dynamicStatus === 'in_progress' ? 'info'
                            : 'default'
                          }
                        />
                      </div>
                      {(group as any).vendor && (
                        <div className="cs-section-vendor">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l1.5-5h15L21 9"/><path d="M5 9v11h14V9"/><path d="M9 22V12h6v10"/></svg>
                          <span>{(group as any).vendor}</span>
                        </div>
                      )}
                      <span className="cs-section-meta">
                        {!isPrototype && <>{madeChoices} of {totalChoices} choices made &middot; </>}
                        {isPrototype && group.options.filter(o => o.selected).length > 0 && <>{group.options.filter(o => o.selected).length} selected &middot; </>}
                        Due {formatDate(group.dueDate)} ({dueDays})
                      </span>
                    </div>
                  </div>
                  <div className="cs-section-right">
                    {pc.showDelta ? (
                      /* Spec: show allowance $0 + additional cost */
                      <>
                        <div className="cs-section-stat">
                          <span className="cs-section-stat-label">Allowance</span>
                          <span className="cs-section-stat-value">$0.00</span>
                        </div>
                        {upgradeCost > 0 && (
                          <div className="cs-section-stat">
                            <span className="cs-section-stat-label">Additional cost</span>
                            <span className="cs-section-stat-value cs-over">${fmt(upgradeCost)}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      /* Custom/Remodel: show allowance and remaining */
                      <>
                        <div className="cs-section-stat">
                          <span className="cs-section-stat-label">Allowance</span>
                          <span className="cs-section-stat-value">${fmt(group.allowance)}</span>
                        </div>
                        <div className="cs-section-stat">
                          <span className="cs-section-stat-label">{diff >= 0 ? 'Remaining' : 'Over'}</span>
                          <span className={`cs-section-stat-value ${diff >= 0 ? 'cs-under' : 'cs-over'}`}>
                            {diff >= 0 ? `$${fmt(diff)}` : `-$${fmt(Math.abs(diff))}`}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                  <div className="cs-section-body">

                    {/* Shopping card grid */}
                    {(() => {
                      const optGroupMap = new Map<string, any[]>();
                      group.options.forEach(opt => {
                        const g = (opt as any).group || 'Other';
                        if (!optGroupMap.has(g)) optGroupMap.set(g, []);
                        optGroupMap.get(g)!.push(opt);
                      });
                      return Array.from(optGroupMap.entries()).map(([gName, unsortedOpts]) => {
                        const opts = [...unsortedOpts].sort((a, b) => {
                          if (group.status === 'approved') {
                            // Chosen first, then unchosen, then declined
                            const aStatus = a.selected ? 0 : declinedOptions.has(a.id) ? 2 : 1;
                            const bStatus = b.selected ? 0 : declinedOptions.has(b.id) ? 2 : 1;
                            if (aStatus !== bStatus) return aStatus - bStatus;
                          }
                          // Within same status, base before upgrade
                          const tierOrder = { base: 0, upgrade: 1 };
                          const aTier = (a as any).tier || 'upgrade';
                          const bTier = (b as any).tier || 'upgrade';
                          return (tierOrder[aTier as keyof typeof tierOrder] ?? 1) - (tierOrder[bTier as keyof typeof tierOrder] ?? 1);
                        });
                        const isMultiChoice = opts.length > 1;
                        const isApproved = group.status === 'approved';
                        const declinedKey = `${group.id}-${gName}`;
                        const isDeclinedExpanded = showDeclined.has(declinedKey);
                        const chosenOpts = isApproved && !isDeclinedExpanded ? opts.filter(o => o.selected) : opts;
                        const hiddenCount = isApproved ? opts.filter(o => !o.selected).length : 0;
                        // Note: sort already places chosen above declined when approved
                        const selectedInGroup = opts.filter(o => o.selected).length;
                        return (
                          <div key={gName} className={`cs-opt-group ${isPrototype ? 'cs-opt-group-proto' : ''}`}>
                            {(isMultiChoice || isPrototype) && (
                              <div className={`cs-opt-group-header ${!isPrototype ? 'cs-opt-group-header-sticky' : 'cs-opt-group-header-proto'}`}>
                                <span className="cs-opt-group-name">{gName}</span>
                                {isPrototype && group.status !== 'approved' && (
                                  <span className="cs-opt-group-count">
                                    {selectedInGroup > 0 ? `${selectedInGroup} selected` : `${opts.length} options`}
                                  </span>
                                )}
                              </div>
                            )}
                            {viewMode === 'compact' ? (
                              /* ── Compact row view (like builder side) ── */
                              <div className="cs-compact-list">
                                {chosenOpts.map(opt => {
                                  const isDeclined = declinedOptions.has(opt.id);
                                  const baseOpt = opts.find(o => (o as any).tier === 'base');
                                  const delta = baseOpt && (opt as any).tier === 'upgrade' ? opt.price - baseOpt.price : 0;
                                  const statusLabel = isDeclined ? 'Declined' : '';
                                  const statusCls = isDeclined ? 'cs-row-status-declined' : '';
                                  return (
                                    <div key={opt.id} className={`cs-compact-row ${opt.selected ? 'cs-compact-row-selected' : ''} ${isDeclined ? 'cs-compact-row-declined' : ''}`}>
                                      <div className="cs-compact-thumb" style={{ backgroundImage: opt.image ? `url(${opt.image})` : undefined }} onClick={() => opt.image && setLightboxImg({images: (opt as any).images || [opt.image], name: opt.name, index: 0, url: (opt as any).url})} />
                                      <div className="cs-compact-info">
                                        <div className="cs-compact-name-row">
                                          <span className="cs-compact-name" style={{ textDecoration: isDeclined ? 'line-through' : 'none', opacity: isDeclined ? 0.5 : 1 }}>{opt.name}</span>
                                          {statusLabel && <span className={`cs-compact-status ${statusCls}`}>{statusLabel}</span>}
                                        </div>
                                        {opt.vendor && <span className="cs-compact-vendor">{opt.vendor}</span>}
                                      </div>
                                      <div className="cs-compact-price">
                                        {pc.showTiers ? (
                                          (opt as any).tier === 'base' ? (
                                            <><span className="cs-tier-badge cs-tier-base">Included</span><span className="cs-preview-price-included">$0</span></>
                                          ) : (opt as any).tier === 'upgrade' ? (
                                            <><span className="cs-tier-badge cs-tier-upgrade">Upgrade</span><span>${fmt(delta)}</span></>
                                          ) : <span>${fmt(opt.price)}</span>
                                        ) : pc.showDelta ? (
                                          (opt as any).tier === 'base' ? <span className="cs-preview-price-included">$0</span>
                                          : <span>${fmt(delta)}</span>
                                        ) : <span>${fmt(opt.price)}</span>}
                                        {pc.showForecast && !isPrototype && !opt.selected && !declinedOptions.has(opt.id) && group.status !== 'approved' && (() => {
                                          const currentGroupSelected = group.options.filter(o => o.selected).reduce((s, o) => s + o.price, 0);
                                          const sameGroupOpts = group.options.filter(o => (o as any).group === (opt as any).group);
                                          const currentSameGroupSelected = sameGroupOpts.find(o => o.selected);
                                          const wouldReplace = currentSameGroupSelected ? currentSameGroupSelected.price : 0;
                                          const newGroupSelected = currentGroupSelected - wouldReplace + opt.price;
                                          const jobImpact = newGroupSelected - group.allowance;
                                          const currentImpact = currentGroupSelected - group.allowance;
                                          const netChange = jobImpact - currentImpact;
                                          return (
                                            <span className={`cs-forecast-inline ${netChange > 0 ? 'cs-forecast-inline-up' : netChange < 0 ? 'cs-forecast-inline-down' : ''}`}>
                                              {netChange > 0 ? '+' : netChange < 0 ? '-' : ''}${fmt(Math.abs(netChange))}
                                            </span>
                                          );
                                        })()}
                                      </div>
                                      <div className="cs-compact-actions">
                                        {group.status !== 'approved' && (
                                          isDeclined ? (
                                            <button className="cs-icon-btn cs-icon-btn-undo" onClick={() => undeclineOption(opt.id)} title="Undo">
                                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                                            </button>
                                          ) : opt.selected ? (
                                            <button className="cs-icon-btn cs-icon-btn-undo" onClick={() => toggleOption(group.id, opt.id)} title="Undo">
                                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                                            </button>
                                          ) : (
                                            <>
                                              <button className="cs-icon-btn cs-icon-btn-decline" onClick={() => declineOption(opt.id, group.id)} title="Skip">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                              </button>
                                              <button className="cs-icon-btn cs-icon-btn-approve" onClick={() => toggleOption(group.id, opt.id)} title="Choose">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                                              </button>
                                            </>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              /* ── Card views: grid (original) or list (big picture) ── */
                              <div className={viewMode === 'grid' ? 'cs-shop-grid' : 'cs-shop-list'}>
                                {chosenOpts.map(opt => {
                                  const isDeclined = declinedOptions.has(opt.id);
                                  const baseOpt = opts.find(o => (o as any).tier === 'base');
                                  const delta = baseOpt && (opt as any).tier === 'upgrade' ? opt.price - baseOpt.price : 0;
                                  return (
                                    <div key={opt.id} className={`cs-shop-card ${opt.selected ? 'cs-shop-card-selected' : ''} ${isDeclined ? 'cs-shop-card-declined' : ''}`}>
                                      {(() => {
                                        const images = (opt as any).images || (opt.image ? [opt.image] : []);
                                        const imgIdx = cardImgIndex[opt.id] || 0;
                                        const currentImg = images[imgIdx] || opt.image;
                                        const hasMultiple = images.length > 1;
                                        return (
                                          <div
                                            className="cs-shop-img"
                                            style={{ backgroundImage: currentImg ? `url(${currentImg})` : undefined, opacity: isDeclined ? 0.4 : 1, cursor: 'pointer' }}
                                            onClick={() => setDetailItem({ groupId: group.id, optionId: opt.id })}
                                          >
                                            {!currentImg && <div className="cs-shop-img-empty"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C7D0D9" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div>}
                                            {opt.selected && <div className="cs-shop-badge-selected"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>}
                                            <button
                                              className={`cs-shop-fav ${favoritedOptions.has(opt.id) ? 'cs-shop-fav-on' : ''}`}
                                              onClick={(e) => { e.stopPropagation(); toggleFavorite(opt.id); }}
                                              title={favoritedOptions.has(opt.id) ? 'Remove from favorites' : 'Save for later'}
                                              aria-label={favoritedOptions.has(opt.id) ? 'Remove from favorites' : 'Save for later'}
                                            >
                                              <svg width="18" height="18" viewBox="0 0 24 24" fill={favoritedOptions.has(opt.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                                            </button>
                                            {group.status !== 'approved' && !opt.selected && (
                                              <button
                                                onClick={(e) => { e.stopPropagation(); toggleCompare(opt.id); }}
                                                title={compareSet.has(opt.id) ? 'Remove from compare' : 'Add to compare'}
                                                aria-label={compareSet.has(opt.id) ? 'Remove from compare' : 'Add to compare'}
                                                style={{
                                                  position: 'absolute', bottom: 10, left: 10, zIndex: 5,
                                                  display: 'inline-flex', alignItems: 'center', gap: 6,
                                                  padding: '5px 10px', border: 'none', cursor: 'pointer',
                                                  background: compareSet.has(opt.id) ? '#004FD6' : 'rgba(255,255,255,0.95)',
                                                  color: compareSet.has(opt.id) ? '#fff' : '#202227',
                                                  fontSize: 11, fontWeight: 600, borderRadius: 999,
                                                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                                                }}
                                              >
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                  {compareSet.has(opt.id)
                                                    ? <polyline points="20 6 9 17 4 12" />
                                                    : <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>}
                                                </svg>
                                                Compare
                                              </button>
                                            )}
                                            {hasMultiple && imgIdx > 0 && (
                                              <button className="cs-shop-arrow cs-shop-arrow-left" onClick={(e) => { e.stopPropagation(); setCardImgIndex(prev => ({...prev, [opt.id]: imgIdx - 1})); }}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                                              </button>
                                            )}
                                            {hasMultiple && imgIdx < images.length - 1 && (
                                              <button className="cs-shop-arrow cs-shop-arrow-right" onClick={(e) => { e.stopPropagation(); setCardImgIndex(prev => ({...prev, [opt.id]: imgIdx + 1})); }}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                                              </button>
                                            )}
                                            {hasMultiple && (
                                              <div className="cs-shop-dots">
                                                {images.map((_: string, i: number) => (
                                                  <span key={i} className={`cs-shop-dot ${i === imgIdx ? 'cs-shop-dot-active' : ''}`} onClick={(e) => { e.stopPropagation(); setCardImgIndex(prev => ({...prev, [opt.id]: i})); }} />
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })()}
                                      <div
                                        className="cs-shop-info"
                                        style={{ opacity: isDeclined ? 0.5 : 1, cursor: 'pointer' }}
                                        onClick={(e) => {
                                          if ((e.target as HTMLElement).closest('button')) return;
                                          setDetailItem({ groupId: group.id, optionId: opt.id });
                                        }}
                                      >
                                        <div className="cs-shop-name-row">
                                          <span className="cs-shop-name" style={{ textDecoration: isDeclined ? 'line-through' : 'none' }}>
                                            {packageItems[opt.id] && (
                                              <span className="cs-shop-pkg-badge">
                                                {packageItems[opt.id].length} items
                                              </span>
                                            )}
                                            {opt.name}
                                          </span>
                                          {isDeclined && <span className="cs-shop-declined-badge">Declined</span>}
                                        </div>
                                        <div className="cs-shop-price-row">
                                          {pc.showTiers ? (
                                            (opt as any).tier === 'base' ? (
                                              <><span className="cs-tier-badge cs-tier-base">Included</span><span className="cs-shop-price cs-preview-price-included">$0</span></>
                                            ) : (opt as any).tier === 'upgrade' ? (
                                              <><span className="cs-tier-badge cs-tier-upgrade">Upgrade</span><span className="cs-shop-price">${fmt(delta)}</span></>
                                            ) : <span className="cs-shop-price">${fmt(opt.price)}</span>
                                          ) : pc.showDelta ? (
                                            (opt as any).tier === 'base' ? <span className="cs-shop-price cs-preview-price-included">$0</span>
                                            : <span className="cs-shop-price">${fmt(delta)}</span>
                                          ) : <span className="cs-shop-price">${fmt(opt.price)}</span>}
                                        </div>
                                        {pc.showForecast && !isPrototype && !opt.selected && !isDeclined && group.status !== 'approved' && (() => {
                                          const currentGroupSelected = group.options.filter(o => o.selected).reduce((s, o) => s + o.price, 0);
                                          const sameGroupOpts = group.options.filter(o => (o as any).group === (opt as any).group);
                                          const currentSameGroupSelected = sameGroupOpts.find(o => o.selected);
                                          const wouldReplace = currentSameGroupSelected ? currentSameGroupSelected.price : 0;
                                          const newGroupSelected = currentGroupSelected - wouldReplace + opt.price;
                                          const jobImpact = newGroupSelected - group.allowance;
                                          const currentImpact = currentGroupSelected - group.allowance;
                                          const netChange = jobImpact - currentImpact;
                                          return (
                                            <div className={`cs-forecast-card-impact ${netChange > 0 ? 'cs-forecast-inline-up' : netChange < 0 ? 'cs-forecast-inline-down' : ''}`}>
                                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
                                              {netChange > 0 ? '+' : netChange < 0 ? '-' : ''}${fmt(Math.abs(netChange))}
                                            </div>
                                          );
                                        })()}
                                        {group.status !== 'approved' && (
                                          <div className="cs-shop-actions">
                                            {isDeclined ? (
                                              <BdsButton text="Undo" displayType="secondary" className="cs-prev-btn-sm" onClick={() => undeclineOption(opt.id)} />
                                            ) : opt.selected ? (
                                              <BdsButton text="Undo" displayType="secondary" className="cs-prev-btn-sm" onClick={() => toggleOption(group.id, opt.id)} />
                                            ) : (
                                              <>
                                                <BdsButton text="Decline" displayType="secondary" className="cs-prev-btn-sm" onClick={() => declineOption(opt.id, group.id)} />
                                                <BdsButton text="Choose" displayType="primary" className="cs-prev-btn-sm" onClick={() => toggleOption(group.id, opt.id)} />
                                              </>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            {/* All declined in this group — prompt to request or show existing request */}
                            {group.status !== 'approved' && opts.every(o => declinedOptions.has(o.id)) && (() => {
                              const existingRequest = requests.find(r => r.groupId === group.id && r.text.toLowerCase().includes(gName.toLowerCase()));
                              if (existingRequest) {
                                return null;
                              }
                              return (
                                <div className="cs-all-declined">
                                  <div className="cs-all-declined-text">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#854D00" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="1" fill="#854D00"/></svg>
                                    <span>You've skipped all {gName.toLowerCase()} options. Request a different one or undo to choose.</span>
                                  </div>
                                  <button className="cs-prev-btn cs-prev-request" onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenRequestGroups(prev => new Set(prev).add(group.id));
                                    setRequestText(prev => ({ ...prev, [group.id]: `Looking for a different ${gName.toLowerCase()} option — declined the current choices.` }));
                                  }}>Request a different {gName.toLowerCase()}</button>
                                </div>
                              );
                            })()}
                            {isApproved && hiddenCount > 0 && (
                              <button className="cs-show-declined" onClick={() => setShowDeclined(prev => {
                                const next = new Set(prev);
                                if (next.has(declinedKey)) next.delete(declinedKey); else next.add(declinedKey);
                                return next;
                              })}>
                                {isDeclinedExpanded ? 'Hide declined options' : `Show declined options (${hiddenCount})`}
                              </button>
                            )}
                          </div>
                        );
                      });
                    })()}

                    {/* Pending requests */}
                    {requests.filter(r => r.groupId === group.id).length > 0 && (
                      <div className="cs-requests-list">
                        <div className="cs-requests-title">Your requests</div>
                        {requests.filter(r => r.groupId === group.id).map((r, i) => (
                          <div key={i} className="cs-request-item">
                            <div className="cs-request-item-top">
                              <span className="cs-request-pending-badge">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                Under review
                              </span>
                              <span className="cs-request-item-date">Sent {r.date}</span>
                            </div>
                            <div className="cs-request-review-status">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#004FD6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                              <span>Your builder is reviewing this request. You'll be notified when they respond.</span>
                            </div>
                            <div className="cs-request-item-text">{r.text}</div>
                            {r.link && (
                              <a className="cs-request-item-link" href={r.link} target="_blank" rel="noopener noreferrer">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                                {r.link.length > 50 ? r.link.slice(0, 50) + '...' : r.link}
                              </a>
                            )}
                            {r.images.length > 0 && (
                              <div className="cs-request-item-imgs">
                                {r.images.map((src, idx) => (
                                  <img key={idx} src={src} alt={`Attached ${idx + 1}`} className="cs-request-item-img" />
                                ))}
                              </div>
                            )}
                            {r.autoApprove && <div className="cs-request-item-auto">Auto-select if approved</div>}
                            <BdsButton
                              text="Edit request"
                              displayType="secondary"
                              className="cs-request-item-edit"
                              icon={<BdsIcon name="edit" size={14} />}
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenRequestGroups(prev => new Set(prev).add(group.id));
                                setRequestText(prev => ({ ...prev, [group.id]: r.text }));
                                setRequestLink(prev => ({ ...prev, [group.id]: r.link }));
                                setRequestImages(prev => ({ ...prev, [group.id]: r.images }));
                                setImageFromLink(prev => ({ ...prev, [group.id]: r.images.length > 0 && !!r.link }));
                                setAutoApprove(r.autoApprove);
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actions — request opens as a popup modal (rendered at component root) */}
                    {group.status !== 'approved' && (
                      <div className="cs-section-actions">
                        <BdsButton text="Request an option" displayType="secondary" onClick={() => setOpenRequestGroups(prev => new Set(prev).add(group.id))} />
                      </div>
                    )}
                  </div>
              </div>
            );
            };

            if (filtered.length === 0) {
              return (
                <div className="cs-empty-state">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C7D0D9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                  <div className="cs-empty-title">
                    {filter === 'action' ? "You're all caught up" : filter === 'favorites' ? 'No favorites yet' : 'No completed selections yet'}
                  </div>
                  <div className="cs-empty-desc">
                    {filter === 'action' ? 'No selections need your attention right now.' : filter === 'favorites' ? 'Tap the star on any option to save it here for later.' : 'Selections will appear here once approved.'}
                  </div>
                </div>
              );
            }
            if (filter === 'all') {
              // Use original status for grouping so cards don't jump while making choices
              const overdue = filtered.filter(g => g.status === 'overdue');
              const dueSoon = filtered.filter(g => g.status === 'action_needed');
              const notStarted = filtered.filter(g => g.status === 'pending');
              const approved = filtered.filter(g => g.status === 'approved');
              return (
                <>
                  {overdue.length > 0 && (
                    <>
                      <h2 className="cs-group-title cs-group-overdue">
                        <svg className="cs-group-title-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        <span>Overdue</span>
                        <span className="cs-group-title-count">{overdue.length}</span>
                      </h2>
                      {overdue.map(renderCard)}
                    </>
                  )}
                  {dueSoon.length > 0 && (
                    <>
                      <h2 className="cs-group-title">
                        <svg className="cs-group-title-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                        </svg>
                        <span>Choices due soon</span>
                        <span className="cs-group-title-count">{dueSoon.length}</span>
                      </h2>
                      {dueSoon.map(renderCard)}
                    </>
                  )}
                  {notStarted.length > 0 && (
                    <>
                      <h2 className="cs-group-title">
                        <svg className="cs-group-title-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="12" cy="12" r="10"/>
                        </svg>
                        <span>Not started</span>
                        <span className="cs-group-title-count">{notStarted.length}</span>
                      </h2>
                      {notStarted.map(renderCard)}
                    </>
                  )}
                  {approved.length > 0 && (
                    <>
                      <h2
                        className="cs-group-title cs-group-title-clickable cs-group-approved"
                        onClick={() => setApprovedExpanded(e => !e)}
                      >
                        <svg className="cs-group-title-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        <span>Approved</span>
                        <span className="cs-group-title-count">{approved.length}</span>
                        <svg className="cs-group-title-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: approvedExpanded ? 'rotate(180deg)' : 'none' }}>
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </h2>
                      {approvedExpanded && approved.map(renderCard)}
                    </>
                  )}
                </>
              );
            }
            return filtered.map(renderCard);
          })()}
        </div>


        {/* Toast — BDS notification pattern */}
        {toastMsg && (
          <div className="cs-toast cs-toast-bds" role="status" aria-live="polite">
            <span className="cs-toast-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
            <span className="cs-toast-text">{toastMsg}</span>
          </div>
        )}
      </div>

      {/* Review modal before submit */}
      {showReviewModal && (
        <div className="sw-overlay" style={{background: 'rgba(0,0,0,0.5)', zIndex: 1500}} onClick={() => setShowReviewModal(false)}>
          <div className="cs-review-modal" onClick={e => e.stopPropagation()}>
            <div className="cs-review-modal-header">
              <h3 className="cs-review-modal-title">Review your selections</h3>
              <button className="cs-review-modal-close" onClick={() => setShowReviewModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <p className="cs-review-modal-sub">Once submitted, these selections are locked in. Please review before confirming.</p>
            <div className="cs-review-modal-list">
              {pendingSubmit.map(group => {
                const selectedOpts = group.options.filter(o => o.selected);
                const groupTotal = selectedOpts.reduce((s, o) => s + o.price, 0);
                const diff = group.allowance - groupTotal;
                return (
                  <div key={group.id} className="cs-review-modal-group">
                    <div className="cs-review-modal-group-name">{group.name}</div>
                    <div className="cs-review-modal-items">
                      {selectedOpts.map(opt => (
                        <div key={opt.id} className="cs-review-modal-item">
                          <div className="cs-review-modal-item-thumb" style={{ backgroundImage: opt.image ? `url(${opt.image})` : undefined }} />
                          <span className="cs-review-modal-item-name">{opt.name}</span>
                          <span className="cs-review-modal-item-price">${fmt(opt.price)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="cs-review-modal-summary">
                      <span>Allowance: ${fmt(group.allowance)}</span>
                      <span className={diff < 0 ? 'cs-over' : diff > 0 ? 'cs-under' : ''}>
                        {diff >= 0 ? `Remaining: $${fmt(diff)}` : `Over: -$${fmt(Math.abs(diff))}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="cs-review-modal-actions">
              <BdsButton text="Submit" displayType="primary" onClick={() => { setShowReviewModal(false); handleSubmitAll(); }} />
              <BdsButton text="Go back" displayType="tertiary" onClick={() => setShowReviewModal(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Option detail modal — V2-inspired info layer for any selection option */}
      {detailItem && (() => {
        const group = selections.find(g => g.id === detailItem.groupId);
        const opt = group?.options.find(o => o.id === detailItem.optionId);
        if (!group || !opt) return null;
        const isDeclined = declinedOptions.has(opt.id);
        const status: 'awaiting' | 'selected' | 'declined' =
          opt.selected ? 'selected' : isDeclined ? 'declined' : 'awaiting';
        const statusMap = {
          selected: { bg: 'rgba(5, 126, 75, 0.10)', fg: '#057E4B', label: 'Selected' },
          declined: { bg: 'rgba(26, 41, 57, 0.06)', fg: '#4E555F', label: 'Declined' },
        } as const;
        const sc = status === 'awaiting' ? null : statusMap[status];

        // Forecast: same math as the inline forecast tag — net change vs. the current group selection
        const currentGroupSelected = group.options.filter(o => o.selected).reduce((s, o) => s + o.price, 0);
        const sameSubgroupOpts = group.options.filter(o => (o as any).group === (opt as any).group);
        const currentSameSubSelected = sameSubgroupOpts.find(o => o.selected);
        const wouldReplace = currentSameSubSelected ? currentSameSubSelected.price : 0;
        const newGroupSelected = currentGroupSelected - wouldReplace + opt.price;
        const remainingIfApproved = group.allowance - newGroupSelected;

        // Specs derived from option fields. Real product data would replace these.
        const styleFromName = opt.name.includes('—') ? opt.name.split('—').pop()!.trim() : null;
        const specs: { label: string; value: string }[] = [
          { label: 'Brand', value: opt.vendor },
          ...(styleFromName ? [{ label: 'Style / color', value: styleFromName }] : []),
          { label: 'Application', value: (opt as any).group || group.name },
          { label: 'Tier', value: (opt as any).tier === 'upgrade' ? 'Premium upgrade' : 'Standard' },
          { label: 'Vendor', value: group.vendor },
        ];

        const messages = optionMessages[opt.id] || [];
        const sendMessage = () => {
          const t = draftMessage.trim();
          if (!t) return;
          const newMsg: OptionMessage = {
            id: `m-${Date.now()}`,
            from: 'client',
            text: t,
            ts: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          };
          setOptionMessages(prev => ({ ...prev, [opt.id]: [...(prev[opt.id] || []), newMsg] }));
          setDraftMessage('');
          showToast('Question sent to your builder');
        };

        const closeModal = () => { setDetailItem(null); setDraftMessage(''); };
        const handleApprove = () => { toggleOption(group.id, opt.id); closeModal(); };
        const handleDecline = () => { declineOption(opt.id, group.id); closeModal(); };

        const modalImages: string[] = (opt as any).images || (opt.image ? [opt.image] : []);
        const safeIdx = Math.min(modalImgIdx, Math.max(0, modalImages.length - 1));
        const heroImg = modalImages[safeIdx];
        const hasMultipleImages = modalImages.length > 1;

        return (
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: '#fff',
              display: 'flex', flexDirection: 'column',
            }}
          >
            <div
              style={{
                position: 'relative', background: '#fff',
                width: '100%', height: '100%',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* Builder-style page header */}
              <div className="pg-hdr cs-detail-hdr" style={{ flexShrink: 0 }}>
                <div className="pg-hdr-content">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span className="pg-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{opt.name}</span>
                        {sc && (
                          <span style={{
                            display: 'inline-block', padding: '3px 10px', fontSize: 11, fontWeight: 600,
                            background: sc.bg, color: sc.fg, borderRadius: 999, whiteSpace: 'nowrap',
                          }}>{sc.label}</span>
                        )}
                      </div>
                      <button className="od-back-link" onClick={closeModal}>&larr; Back to selections</button>
                    </div>
                  </div>
                  <div className="pg-hdr-right">
                    <button
                      className="cs-detail-hdr-icon-btn"
                      onClick={() => setCommentsPanelOpen(true)}
                      aria-label={`Comments${messages.length > 0 ? ` (${messages.length})` : ''}`}
                      title="Comments"
                    >
                      <BdsIcon name={messages.length > 0 ? 'comments-filled' : 'comments'} size={20} />
                      {messages.length > 0 && (
                        <span className="cs-detail-hdr-icon-badge">{messages.length}</span>
                      )}
                    </button>
                    {group.status !== 'approved' && (
                      status === 'selected' ? (
                        <BdsButton text="Undo" displayType="secondary" onClick={handleDecline} />
                      ) : status === 'declined' ? (
                        <BdsButton text="Undo decline" displayType="secondary" onClick={() => { undeclineOption(opt.id); closeModal(); }} />
                      ) : (
                        <>
                          <BdsButton text="Decline" displayType="secondary" onClick={handleDecline} />
                          <BdsButton text="Choose" displayType="primary" onClick={handleApprove} />
                        </>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Body — builder OptionDetailPage layout, read-only */}
              <div className="od-body cs-detail-body">
                <div className="od-content">
                  {/* Details + Specs/Images two-column */}
                  <div className="od-two-col cs-detail-two-col">
                    {/* Left — Details (read-only) */}
                    <div>
                      <h3 className="od-section-title">Details</h3>

                      <div className="od-field">
                        <label className="fl">Title</label>
                        <div className="cs-detail-readonly">{opt.name}</div>
                      </div>

                      <div className="od-field">
                        <label className="fl">Description</label>
                        <div className="cs-detail-readonly cs-detail-readonly-multiline">
                          {packageItems[opt.id]
                            ? `Coordinated ${opt.name.toLowerCase()} package from ${opt.vendor}. Includes ${packageItems[opt.id].length} items — fixtures, accessories, and installation. Approving this locks in the entire set.`
                            : (opt as any).tier === 'upgrade'
                              ? `Premium upgrade option from ${opt.vendor}. Selecting this adds to your base allowance.`
                              : `Standard option from ${opt.vendor}, included in your base allowance.`}
                        </div>
                      </div>

                      <div className="od-field">
                        <label className="fl">Allowance</label>
                        <div className="cs-detail-readonly">{group.name}</div>
                      </div>

                      <div className="od-field-row" style={{ display: 'flex', gap: 16 }}>
                        <div className="od-field" style={{ flex: 1 }}>
                          <label className="fl">Category</label>
                          <div className="cs-detail-readonly">{(opt as any).group || group.name}</div>
                        </div>
                        <div className="od-field" style={{ flex: 1 }}>
                          <label className="fl">Tier</label>
                          <div className="cs-detail-readonly">
                            {(opt as any).tier === 'upgrade' ? 'Premium upgrade' : 'Standard'}
                          </div>
                        </div>
                      </div>

                      <div className="od-field">
                        <label className="fl">Product URL</label>
                        {(opt as any).url ? (
                          <div className="cs-detail-readonly cs-detail-readonly-link">
                            <a href={(opt as any).url} target="_blank" rel="noopener noreferrer">
                              {(opt as any).url}
                            </a>
                          </div>
                        ) : (
                          <div className="cs-detail-readonly cs-detail-readonly-empty">—</div>
                        )}
                      </div>

                      {/* Allowance impact callout */}
                      <div className="cs-detail-impact">
                        <div className="cs-detail-impact-label">
                          {status === 'selected' ? 'Allowance impact' : 'If you choose this'}
                        </div>
                        <div className="cs-detail-impact-body">
                          {remainingIfApproved >= 0 ? (
                            <>You'll have <strong>${fmt(remainingIfApproved)} left</strong> in the {group.name.toLowerCase()} allowance.</>
                          ) : (
                            <>You'll be <strong style={{ color: '#B5254C' }}>${fmt(Math.abs(remainingIfApproved))} over</strong> the {group.name.toLowerCase()} allowance.</>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right — Image gallery + Specs */}
                    <div>
                      <h3 className="od-section-title">Images</h3>
                      <div className="cs-detail-gallery">
                        <div
                          className="cs-detail-gallery-hero"
                          style={{ backgroundImage: heroImg ? `url(${heroImg})` : undefined }}
                        >
                          {hasMultipleImages && safeIdx > 0 && (
                            <button
                              className="cs-detail-gallery-arrow cs-detail-gallery-arrow-left"
                              onClick={() => setModalImgIdx(safeIdx - 1)}
                              aria-label="Previous image"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                            </button>
                          )}
                          {hasMultipleImages && safeIdx < modalImages.length - 1 && (
                            <button
                              className="cs-detail-gallery-arrow cs-detail-gallery-arrow-right"
                              onClick={() => setModalImgIdx(safeIdx + 1)}
                              aria-label="Next image"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                            </button>
                          )}
                          {hasMultipleImages && (
                            <div className="cs-detail-gallery-dots">
                              {modalImages.map((_, i) => (
                                <span
                                  key={i}
                                  onClick={() => setModalImgIdx(i)}
                                  className={`cs-detail-gallery-dot ${i === safeIdx ? 'cs-detail-gallery-dot-active' : ''}`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        {hasMultipleImages && (
                          <div className="cs-detail-gallery-thumbs">
                            {modalImages.map((img, i) => (
                              <button
                                key={i}
                                onClick={() => setModalImgIdx(i)}
                                aria-label={`View image ${i + 1}`}
                                className={`cs-detail-gallery-thumb ${i === safeIdx ? 'cs-detail-gallery-thumb-active' : ''}`}
                                style={{ backgroundImage: `url(${img})` }}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      <h3 className="od-section-title" style={{ marginTop: 24 }}>Specs</h3>
                      <div className="cs-detail-specs">
                        {specs.map((s, i) => (
                          <div key={i} className="cs-detail-specs-row">
                            <div className="cs-detail-specs-label">{s.label}</div>
                            <div className="cs-detail-specs-value">{s.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <hr className="od-divider" />

                  {/* Price details — read-only. Packaged options show every included line item. */}
                  {(() => {
                    const pkg = packageItems[opt.id];
                    return (
                      <>
                        <h3 className="od-section-title">{pkg ? "What's included" : 'Price details'}</h3>
                        <div className="od-price-table-wrap">
                          <div className="od-price-scroll">
                            <table className="od-price-table">
                              <thead>
                                <tr>
                                  <th>Item</th>
                                  <th>Description</th>
                                  <th style={{ textAlign: 'right' }}>Quantity</th>
                                  <th>Unit</th>
                                  <th style={{ textAlign: 'right' }}>Unit cost</th>
                                  <th>Cost type</th>
                                </tr>
                              </thead>
                              <tbody>
                                {pkg ? (
                                  pkg.map((it, i) => (
                                    <tr key={i} className="cs-detail-price-row">
                                      <td><strong>{it.name}</strong></td>
                                      <td style={{ color: 'var(--g600)' }}>Part of {opt.name}</td>
                                      <td style={{ textAlign: 'right' }}>{it.qty}</td>
                                      <td>{it.unit}</td>
                                      <td style={{ textAlign: 'right' }}>${fmt(it.price)}</td>
                                      <td>{it.name.toLowerCase().includes('labor') ? 'Labor' : 'Selection'}</td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr className="cs-detail-price-row">
                                    <td><strong>{opt.name}</strong></td>
                                    <td style={{ color: 'var(--g600)' }}>From {opt.vendor}</td>
                                    <td style={{ textAlign: 'right' }}>1</td>
                                    <td>ea</td>
                                    <td style={{ textAlign: 'right' }}>${fmt(opt.price)}</td>
                                    <td>{(opt as any).tier === 'upgrade' ? 'Selection (upgrade)' : 'Selection'}</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                        <div className="od-price-footer">
                          <div><strong>{pkg ? 'Package total' : 'Total price'}: ${fmt(opt.price)}</strong></div>
                          {pkg && (
                            <span style={{ color: 'var(--g500)', fontSize: 12 }}>
                              {pkg.length} items included
                            </span>
                          )}
                        </div>
                      </>
                    );
                  })()}

                </div>
              </div>

              {/* Comments side panel — slide-in from right with chat-style thread */}
              {commentsPanelOpen && (
                <>
                  <div
                    className="cs-comments-panel-overlay"
                    onClick={() => setCommentsPanelOpen(false)}
                  />
                  <aside className="cs-comments-panel" role="dialog" aria-label="Comments">
                    <header className="cs-comments-panel-hdr">
                      <h3>Comments</h3>
                      <button
                        className="cs-comments-panel-close"
                        onClick={() => setCommentsPanelOpen(false)}
                        aria-label="Close comments"
                      >
                        <BdsIcon name="x" size={18} />
                      </button>
                    </header>
                    <div className="cs-comments-panel-body">
                      {messages.length === 0 ? (
                        <div className="cs-comments-panel-empty">
                          <BdsIcon name="comments" size={32} />
                          <div className="cs-comments-panel-empty-title">No comments yet</div>
                          <div className="cs-comments-panel-empty-sub">Ask your builder anything about this option.</div>
                        </div>
                      ) : (
                        <div className="cs-comments-panel-thread">
                          {messages.map(m => (
                            <div key={m.id} className={`cs-detail-comment cs-detail-comment-${m.from}`}>
                              <div>{m.text}</div>
                              <div className="cs-detail-comment-meta">
                                {m.from === 'client' ? 'You' : 'Your builder'} · {m.ts}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <footer className="cs-comments-panel-footer">
                      <input
                        className="cs-comments-panel-input"
                        value={draftMessage}
                        onChange={e => setDraftMessage(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
                        placeholder="Ask a question…"
                      />
                      <BdsButton
                        text="Send"
                        displayType="primary"
                        onClick={sendMessage}
                        disabled={!draftMessage.trim()}
                        icon={<BdsIcon name="send" size={14} />}
                      />
                    </footer>
                  </aside>
                </>
              )}

            </div>
          </div>
        );
      })()}

      {/* Request an option — popup modal (replaces inline form for cleaner flow) */}
      {(() => {
        const openId = openRequestGroups.values().next().value;
        if (!openId) return null;
        const group = selections.find(g => g.id === openId);
        if (!group) return null;
        const close = () => resetRequest(openId);
        const text = requestText[openId] || '';
        const link = requestLink[openId] || '';
        const images = requestImages[openId] || [];
        return (
          <div
            onClick={close}
            style={{
              position: 'fixed', inset: 0, zIndex: 230,
              background: 'rgba(20, 28, 50, 0.55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 24,
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: '#fff', borderRadius: 14,
                width: '100%', maxWidth: 520,
                maxHeight: 'calc(100vh - 48px)',
                display: 'flex', flexDirection: 'column',
                boxShadow: '0 20px 60px rgba(20, 28, 50, 0.25)',
                overflow: 'hidden',
              }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px', borderBottom: '1px solid #EAEEF5', flexShrink: 0,
              }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#666D7C', textTransform: 'uppercase', letterSpacing: 0.4 }}>{group.name}</div>
                  <h3 style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 700, color: '#202227' }}>Request another option</h3>
                </div>
                <button
                  onClick={close}
                  aria-label="Close"
                  style={{
                    width: 32, height: 32, border: 'none', borderRadius: 999,
                    background: '#F1F4FA', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#202227" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div style={{ overflowY: 'auto', padding: 20 }}>
                <div className="cs-inline-request-label">
                  Product link <span className="cs-inline-request-required" aria-label="required">*</span>
                </div>
                <div className="cs-request-link-wrap cs-inline-request-link">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  <BdsInput
                    id={`request-link-${openId}`}
                    className="cs-request-link-input"
                    placeholder="Paste a product link — we'll pull the image"
                    value={link}
                    onChange={(_, v) => setRequestLink(prev => ({ ...prev, [openId]: v }))}
                    onBlur={e => fetchImageFromLink(openId, e.target.value)}
                    onPaste={e => {
                      const pasted = e.clipboardData.getData('text');
                      setTimeout(() => fetchImageFromLink(openId, pasted), 0);
                    }}
                    autoFocus
                  />
                  {linkFetching[openId] && <span className="cs-link-spinner" aria-label="Fetching preview" />}
                  {link && (
                    <button
                      className="cs-inline-request-remove"
                      onClick={() => {
                        setRequestLink(prev => ({ ...prev, [openId]: '' }));
                        if (imageFromLink[openId]) {
                          setRequestImages(prev => ({ ...prev, [openId]: (prev[openId] || []).slice(1) }));
                          setImageFromLink(prev => ({ ...prev, [openId]: false }));
                        }
                      }}
                      aria-label="Clear link"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  )}
                </div>

                <div className="cs-inline-request-label cs-inline-request-label-spaced">Notes</div>
                <BdsTextArea
                  id={`request-text-${openId}`}
                  className="cs-request-input cs-inline-request-textarea"
                  placeholder="e.g. Something more modern · matte black finish · similar price to the Delta faucet"
                  value={text}
                  onChange={(_, v) => setRequestText(prev => ({ ...prev, [openId]: v }))}
                  rows={3}
                />

                {images.length > 0 && (
                  <div className="cs-inline-request-photos">
                    {images.map((src, idx) => (
                      <div key={`${idx}-${src.slice(0, 40)}`} className="cs-inline-request-photo">
                        <img src={src} alt={`Attached ${idx + 1}`} />
                        {idx === 0 && imageFromLink[openId] && <span className="cs-photo-source-tag">From link</span>}
                        <button
                          className="cs-inline-request-remove"
                          onClick={() => {
                            setRequestImages(prev => ({ ...prev, [openId]: (prev[openId] || []).filter((_, i) => i !== idx) }));
                            if (idx === 0 && imageFromLink[openId]) setImageFromLink(prev => ({ ...prev, [openId]: false }));
                          }}
                          aria-label={`Remove photo ${idx + 1}`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <label className="cs-inline-request-add-photo">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  {images.length > 0 ? 'Add another photo' : 'Add a photo (optional)'}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = ev => {
                        const src = ev.target?.result as string;
                        if (src) setRequestImages(prev => ({ ...prev, [openId]: [...(prev[openId] || []), src] }));
                      };
                      reader.readAsDataURL(file);
                    }
                    e.currentTarget.value = '';
                  }} />
                </label>
              </div>

              <div style={{
                flexShrink: 0, padding: 16, background: '#fff',
                borderTop: '1px solid #EAEEF5', display: 'flex', gap: 10, justifyContent: 'flex-end',
              }}>
                <BdsButton text="Cancel" displayType="tertiary" onClick={close} />
                <BdsButton
                  text="Send request"
                  displayType="primary"
                  disabled={!text.trim() || !link.trim()}
                  onClick={() => submitRequest(openId)}
                  icon={<BdsIcon name="send" size={14} />}
                />
              </div>
            </div>
          </div>
        );
      })()}

      {/* Compare floating action bar — BDS FAB pattern */}
      {/* BDS: production should use BdsFloatingActionBar with selectedCount + onDeselect + primaryActions */}
      {compareSet.size > 0 && !showCompare && !detailItem && !showReviewModal && (
        <div className="cs-compare-fab" role="toolbar" aria-label="Compare selections">
          <div className="cs-compare-fab-section cs-compare-fab-selected">
            <span className="cs-compare-fab-count">{compareSet.size} Selected</span>
            <button
              className="cs-compare-fab-deselect"
              aria-label="Clear compare selection"
              onClick={() => setCompareSet(new Set())}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="cs-compare-fab-section">
            <button
              className="cs-compare-fab-primary"
              disabled={compareSet.size < 2}
              onClick={() => setShowCompare(true)}
            >
              Compare
            </button>
          </div>
        </div>
      )}

      {/* Compare modal — side-by-side product comparison */}
      {showCompare && (() => {
        const items: { group: typeof selections[0]; opt: typeof selections[0]['options'][0] }[] = [];
        compareSet.forEach(id => {
          for (const g of selections) {
            const o = g.options.find(o => o.id === id);
            if (o) { items.push({ group: g, opt: o }); break; }
          }
        });
        if (items.length === 0) { setShowCompare(false); return null; }

        const closeCompare = () => setShowCompare(false);
        const styleFromName = (name: string) => name.includes('—') ? name.split('—').pop()!.trim() : '—';
        const tierLabel = (o: any) => o.tier === 'upgrade' ? 'Premium upgrade' : o.tier === 'base' ? 'Standard' : '—';

        const rows: { label: string; render: (it: typeof items[0]) => React.ReactNode }[] = [
          { label: 'Price', render: ({ opt }) => <strong style={{ fontSize: 16 }}>${fmt(opt.price)}</strong> },
          { label: 'Brand', render: ({ opt }) => opt.vendor },
          { label: 'Style / color', render: ({ opt }) => styleFromName(opt.name) },
          { label: 'Application', render: ({ opt, group }) => (opt as any).group || group.name },
          { label: 'Tier', render: ({ opt }) => tierLabel(opt) },
          { label: 'Vendor', render: ({ group }) => group.vendor },
          { label: 'Status', render: ({ opt }) => {
            if (opt.selected) return <span style={{ color: '#057E4B', fontWeight: 600 }}>Selected</span>;
            if (declinedOptions.has(opt.id)) return <span style={{ color: '#666D7C' }}>Declined</span>;
            return <span style={{ color: '#666D7C' }}>Awaiting</span>;
          } },
          { label: 'Product link', render: ({ opt }) => (opt as any).url
            ? <a href={(opt as any).url} target="_blank" rel="noopener noreferrer" style={{ color: '#004FD6', fontSize: 12, textDecoration: 'none' }}>View →</a>
            : <span style={{ color: '#8E96A0' }}>—</span>,
          },
        ];

        return (
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 220,
              background: '#fff',
              display: 'flex', flexDirection: 'column',
            }}
          >
            <div
              style={{
                background: '#fff',
                width: '100%', height: '100%',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px', borderBottom: '1px solid #EAEEF5', flexShrink: 0,
              }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#202227' }}>
                  Compare {items.length} {items.length === 1 ? 'option' : 'options'}
                </h3>
                <button
                  onClick={closeCompare}
                  aria-label="Close"
                  style={{
                    width: 36, height: 36, border: 'none', borderRadius: 999,
                    background: '#F1F4FA', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#202227" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div style={{ overflow: 'auto', padding: 16 }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `140px repeat(${items.length}, minmax(180px, ${items.length <= 2 ? '280px' : items.length === 3 ? '320px' : '1fr'}))`,
                  gap: 0,
                  margin: '0 auto',
                  maxWidth: 'fit-content',
                }}>
                  {/* Header row: thumbnails + names */}
                  <div />
                  {items.map(({ opt, group }) => (
                    <div key={opt.id} style={{ padding: 12, borderBottom: '1px solid #EAEEF5' }}>
                      <div style={{
                        width: '100%',
                        maxWidth: items.length === 2 ? 200 : items.length === 3 ? 240 : 280,
                        aspectRatio: '4 / 3', borderRadius: 10,
                        backgroundImage: opt.image ? `url(${opt.image})` : undefined,
                        backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#F1F4FA',
                        marginBottom: 8,
                      }} />
                      <div style={{ fontSize: 11, color: '#666D7C', textTransform: 'uppercase', letterSpacing: 0.4 }}>{group.name}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#202227', lineHeight: 1.3, marginTop: 2 }}>{opt.name}</div>
                      <button
                        onClick={() => toggleCompare(opt.id)}
                        style={{
                          marginTop: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600,
                          border: '1px solid #DEE3EB', borderRadius: 999, background: '#fff',
                          color: '#666D7C', cursor: 'pointer',
                        }}
                      >Remove</button>
                    </div>
                  ))}

                  {/* Spec rows */}
                  {rows.map((row) => (
                    <Fragment key={row.label}>
                      <div style={{
                        padding: '12px 8px', fontSize: 12, fontWeight: 600,
                        color: '#666D7C', textTransform: 'uppercase', letterSpacing: 0.4,
                        borderBottom: '1px solid #F1F4FA', alignSelf: 'center',
                      }}>{row.label}</div>
                      {items.map(it => (
                        <div key={`${it.opt.id}-${row.label}`} style={{
                          padding: '12px', fontSize: 13, color: '#202227',
                          borderBottom: '1px solid #F1F4FA',
                        }}>{row.render(it)}</div>
                      ))}
                    </Fragment>
                  ))}

                  {/* Action row */}
                  <div style={{
                    padding: '12px 8px', fontSize: 12, fontWeight: 600,
                    color: '#666D7C', textTransform: 'uppercase', letterSpacing: 0.4,
                    alignSelf: 'center',
                  }}>Decision</div>
                  {items.map(({ opt, group }) => {
                    const isSelected = opt.selected;
                    const isDecl = declinedOptions.has(opt.id);
                    return (
                      <div key={`${opt.id}-action`} style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {isSelected ? (
                          <BdsButton text="Undo" displayType="secondary" className="cs-prev-btn-sm" onClick={() => toggleOption(group.id, opt.id)} />
                        ) : isDecl ? (
                          <BdsButton text="Undo decline" displayType="secondary" className="cs-prev-btn-sm" onClick={() => undeclineOption(opt.id)} />
                        ) : (
                          <>
                            <BdsButton
                              text="Choose"
                              displayType="primary"
                              className="cs-prev-btn-sm"
                              onClick={() => toggleOption(group.id, opt.id)}
                            />
                            <BdsButton
                              text="Decline"
                              displayType="tertiary"
                              className="cs-prev-btn-sm"
                              onClick={() => declineOption(opt.id, group.id)}
                            />
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Sticky footer — only show once user has taken an action in this session */}
      {hasInteracted && (
      <div className={`cs-sticky-footer ${isBds ? 'bds-scope bds-real-scope' : ''}`}>
        <div className="cs-sticky-inner">
          <div className="cs-sticky-info">
            {pendingSubmit.length > 0 ? (
              <><strong>{pendingSubmit.length} selection{pendingSubmit.length > 1 ? 's' : ''}</strong> ready — submit to lock in your choices</>
            ) : null}
          </div>
          <div className="cs-sticky-actions">
            <BdsButton text="Save" displayType="secondary" className="cs-save-btn" onClick={handleSaveProgress} />
            {pendingSubmit.length > 0 && (
              <BdsButton text="Review & submit" displayType="primary" onClick={() => setShowReviewModal(true)} />
            )}
          </div>
        </div>
      </div>
      )}
    </>
  );
}
