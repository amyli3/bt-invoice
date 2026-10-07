import { useState, useCallback, useEffect, Fragment } from 'react';
import '../bds-tokens.css';
import { BdsButton, BdsBadge, BdsInput, BdsTextArea, BdsIcon } from '../bds';
import SelectionFloorPlan, { roomForGroup, RoomSummary, FLOOR_PLAN_ROOMS, WHOLE_HOUSE_ID, RoomIcon } from './SelectionFloorPlan';
import SelectionMoodBoard, { BoardItem } from './SelectionMoodBoard';
import FloorPlanPage from './FloorPlanPage';
import AllowancePanel, { AllowanceComment, AllowanceOptionStatus } from './AllowancePanel';

/* ── Mock data ──
 * Allowances are grouped by vendor type (e.g. flooring, tile, plumbing).
 * Each option's `group` is the room/area within that vendor type
 * (e.g. "Kitchen flooring", "Master bath shower"). */
const selectionGroups = [
  {
    id: 'sel-1', name: 'Flooring', vendor: 'Cornerstone Flooring',
    allowance: 18500, dueDate: '2026-10-14', status: 'action_needed' as const,
    description: 'Pick flooring for each room. Your flooring vendor offers hardwood, vinyl plank, laminate, and carpet. Choose what fits each space.',
    options: [
      // Kitchen flooring
      { id: 'fl-k1', name: 'Lifeproof Vinyl Plank, Dusk Cherry', vendor: 'Lifeproof', price: 3200, image: 'https://images.thdstatic.com/productImages/eb9b442d-4536-470d-81e4-f1bea67caf9d/svn/dusk-cherry-lifeproof-vinyl-plank-flooring-i06204lp-64_600.jpg', selected: false, group: 'Kitchen flooring', tier: 'base' as const },
      { id: 'fl-k2', name: 'Shaw Natural Classics, White Oak', vendor: 'Shaw Floors', price: 4800, image: 'https://shawfloors.widen.net/content/maw31txwtx/jpeg/sw774_01147_main', selected: false, group: 'Kitchen flooring', tier: 'upgrade' as const },
      // Living room flooring
      { id: 'fl-l1', name: 'TrafficMaster Laminate, Lakeshore Pecan', vendor: 'TrafficMaster', price: 2400, image: 'https://images.thdstatic.com/productImages/a08ca173-0a82-4dbe-90fb-7bdd3e8309a7/svn/lakeshore-pecan-stone-trafficmaster-laminate-wood-flooring-50560-77_600.jpg', selected: false, group: 'Living room flooring', tier: 'base' as const },
      { id: 'fl-l2', name: 'Bruce Solid Hardwood, Butterscotch Oak', vendor: 'Bruce', price: 5800, image: 'https://images.thdstatic.com/productImages/c29747ad-e373-456b-8cdd-fc380f7fd554/svn/butterscotch-bruce-solid-hardwood-ahs626-64_1000.jpg', selected: false, group: 'Living room flooring', tier: 'upgrade' as const },
      // Bedroom flooring — consolidated for all bedrooms (master + bedrooms 2 & 3)
      { id: 'fl-m1', name: 'Mohawk Plush Carpet, Sandstone', vendor: 'Mohawk', price: 1600, image: 'https://cdn11.bigcommerce.com/s-2d2cb/images/stencil/1280x1280/products/74638/189074/28326_00__21267.1668113654.jpg?c=2?imbypass=on', images: ['https://cdn11.bigcommerce.com/s-2d2cb/images/stencil/1280x1280/products/74638/189074/28326_00__21267.1668113654.jpg?c=2?imbypass=on', 'https://cdn11.bigcommerce.com/s-2d2cb/images/stencil/728x728/products/74638/189073/O_28326_958_mindful__35970.1668113650.jpg?c=2'], selected: false, group: 'Bedroom carpet', tier: 'base' as const , colors: [{ name: 'Sandstone', hex: '#CDBFA8' }, { name: 'Mineral beige', hex: '#BFAF96', image: 'https://s7d4.scene7.com/is/image/MohawkResidential/28989_743_room_02?scl=2&op_sharpen=1' }, { name: 'Storm gray', hex: '#8C8D8F' }] },
      { id: 'fl-m2', name: 'Stainmaster Berber Carpet, Driftwood', vendor: 'Stainmaster', price: 2300, image: 'https://mobileimages.lowes.com/productimages/fe119674-3be7-4753-ab30-ac78df03cf27/72813536.jpeg', images: ['https://mobileimages.lowes.com/productimages/fe119674-3be7-4753-ab30-ac78df03cf27/72813536.jpeg', 'https://mobileimages.lowes.com/product/converted/840712/840712114608.jpg?size=pdhism'], selected: false, group: 'Bedroom carpet', tier: 'upgrade' as const },
      { id: 'fl-b1', name: 'Mohawk Plush Carpet, Mineral Beige', vendor: 'Mohawk', price: 1300, image: 'https://s7d4.scene7.com/is/image/MohawkResidential/28989_743_room_02?scl=2&op_sharpen=1', images: ['https://s7d4.scene7.com/is/image/MohawkResidential/28989_743_room_02?scl=2&op_sharpen=1', 'https://cdn11.bigcommerce.com/s-2d2cb/images/stencil/728x728/products/75581/192373/2P40-518_Hearth_Beige__79900.1682089402.jpg?c=2'], selected: false, group: 'Bedroom carpet', tier: 'base' as const },
    ],
  },
  // Packaged selection — Good / Better / Best bundles where each option is a coordinated set
  {
    id: 'sel-pkg-bath', name: 'Master bath fixtures', vendor: 'Allied Bath Collections',
    allowance: 8000, dueDate: '2026-10-02', status: 'overdue' as const,
    description: 'One coordinated set for the master bath: vanity faucets, shower valve and trim, toilet, towel bars and accessories. Approving a package locks in every item in it.',
    options: [
      {
        id: 'pkg-bath-good', name: 'Moen Align Collection', vendor: 'Moen',
        price: 4400, image: 'https://images.thdstatic.com/productImages/a96c1819-3c0e-4dea-bf0c-ead6d07eb686/svn/chrome-moen-bathtub-shower-faucet-combos-82603-64_1000.jpg',
        colors: [{ name: 'Chrome', hex: '#E6E9ED' }, { name: 'Brushed nickel', hex: '#B9B6AE' }, { name: 'Matte black', hex: '#1F2124' }], selected: false, group: 'Master bath fixture package', tier: 'base' as const,
      },
      {
        id: 'pkg-bath-better', name: 'Delta Trinsic Collection', vendor: 'Delta',
        price: 6200, image: 'https://m.media-amazon.com/images/I/71FK1buvW+L.jpg',
        colors: [{ name: 'Matte black', hex: '#1F2124', image: 'https://m.media-amazon.com/images/I/71FK1buvW+L.jpg' }, { name: 'Champagne bronze', hex: '#B08D57' }, { name: 'Chrome', hex: '#E6E9ED' }], selected: false, group: 'Master bath fixture package', tier: 'upgrade' as const,
      },
      {
        id: 'pkg-bath-best', name: 'Kohler Purist Collection', vendor: 'Kohler',
        price: 8400, image: 'https://images.thdstatic.com/productImages/d9b0b956-0169-4319-ad0e-f96098bc1fcc/svn/white-kohler-farmhouse-kitchen-sinks-k-28668-0-e1_600.jpg',
        colors: [{ name: 'Brushed brass', hex: '#C8A15A' }, { name: 'Polished chrome', hex: '#E6E9ED' }, { name: 'Matte black', hex: '#1F2124' }], selected: false, group: 'Master bath fixture package', tier: 'upgrade' as const,
      },
    ],
  },
  {
    id: 'sel-2', name: 'Tile', vendor: 'Premier Tile & Stone',
    allowance: 9500, dueDate: '2026-10-09', status: 'action_needed' as const,
    description: 'Choose tile for backsplashes, shower walls, and bath floors. The same vendor supplies all tile so styles can be coordinated.',
    options: [
      // Kitchen backsplash
      { id: 'tl-k1', name: 'White Subway Tile Backsplash', vendor: 'Merola Tile', price: 620, image: 'https://images.thdstatic.com/productImages/502e06ba-dcea-4c4b-b2f0-5cc5a55a2704/svn/glossy-white-merola-tile-ceramic-tile-web3chgw-64_600.jpg', selected: false, group: 'Kitchen backsplash', tier: 'base' as const , colors: [{ name: 'Glossy white', hex: '#F4F4F2' }, { name: 'Sage', hex: '#A8B5A0' }, { name: 'Navy', hex: '#2E3A55' }] },
      { id: 'tl-k2', name: 'Marble Hexagon Backsplash', vendor: 'TileBar', price: 950, image: 'https://www.tileclub.com/cdn/shop/files/carrara-hexagon-tile-backsplash-2.jpg?v=1723504600', selected: false, group: 'Kitchen backsplash', tier: 'upgrade' as const },
      // Master bath floor
      { id: 'tl-mbf1', name: 'Porcelain Hex Tile, White', vendor: 'Merola Tile', price: 2200, image: 'https://images.thdstatic.com/productImages/356a61c1-2e11-4f60-8b64-1b35ad5f289b/svn/white-medium-sheen-merola-tile-porcelain-tile-fcd10wtx-e1_600.jpg', selected: false, group: 'Master bath floor tile', tier: 'base' as const },
      { id: 'tl-mbf2', name: 'Carrara White Marble Floor Tile', vendor: 'TileBar', price: 2800, image: 'https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcSGYKPyoe2Rzl-1bS94z9jjJrgknQCps5Ce5qwPPfI0-R7MOIqopooLat3pDoWs2LmGHx0WEc3lGD93Gy0TnSnoFvsEsSami58-o4SCkcg0n9cgZLY_fdtC4w', selected: false, group: 'Master bath floor tile', tier: 'upgrade' as const },
      { id: 'tl-mbf3', name: 'Daltile Porcelain, Concrete Look Gray', vendor: 'Daltile', price: 1900, image: 'https://www.mineraltiles.com/cdn/shop/files/florence-calacatta-gold-porcelain-tile-39x39.jpg?v=1712084519&width=1150', selected: false, group: 'Master bath floor tile', tier: 'base' as const },
      // Master bath shower
      { id: 'tl-s1', name: 'Glossy White Subway Tile', vendor: 'Merola Tile', price: 1200, image: 'https://images.thdstatic.com/productImages/502e06ba-dcea-4c4b-b2f0-5cc5a55a2704/svn/glossy-white-merola-tile-ceramic-tile-web3chgw-64_600.jpg', colors: [{ name: 'Glossy white', hex: '#F4F4F2' }, { name: 'Sea glass', hex: '#9FC3B8' }, { name: 'Warm gray', hex: '#A39E96' }], selected: false, group: 'Master bath shower wall tile', tier: 'base' as const },
      { id: 'tl-s2', name: 'Penny Round Mosaic, Matte White', vendor: 'Merola Tile', price: 980, image: 'https://m.media-amazon.com/images/I/51u37UdURlL._AC_UF350,350_QL80_.jpg', selected: false, group: 'Master bath shower wall tile', tier: 'base' as const },
      { id: 'tl-s3', name: 'Herringbone Marble Mosaic', vendor: 'TileBar', price: 1800, image: 'https://www.stonecenteronline.com/media/catalog/product/cache/f77b4f15034ebe734bb6931a52e0b5ed/c/7/c72xh-carrara-white-marble-1x3-herringbone-mosaic-tile-honed.jpg', selected: false, group: 'Master bath shower wall tile', tier: 'upgrade' as const },
      { id: 'tl-s4', name: 'Arabesque Lantern Mosaic, White', vendor: 'MSI', price: 1450, image: 'https://images.thdstatic.com/productImages/342247dc-6a7d-47d3-ad33-2e140184c3fe/svn/carrara-white-glass-tile-mabq-whi-10-4f_600.jpg', selected: false, group: 'Master bath shower wall tile', tier: 'upgrade' as const },
      // Powder room floor
      { id: 'tl-p1', name: 'Large Format Porcelain, Calacatta', vendor: 'Daltile', price: 0, image: 'https://www.mineraltiles.com/cdn/shop/files/florence-calacatta-gold-porcelain-tile-39x39.jpg?v=1712084519&width=1150', selected: false, group: 'Powder floor tile', tier: 'base' as const },
      { id: 'tl-p2', name: 'Basketweave Marble Mosaic', vendor: 'Jeffrey Court', price: 950, image: 'https://m.media-amazon.com/images/I/71ptOTYeLGL._AC_UF894,1000_QL80_.jpg', selected: false, group: 'Powder floor tile', tier: 'upgrade' as const },
    ],
  },
  {
    id: 'sel-3', name: 'Plumbing fixtures', vendor: 'Ferguson Plumbing Supply',
    allowance: 5800, dueDate: '2026-10-16', status: 'pending' as const,
    description: 'Pick the kitchen sink and faucet. Master bath fixtures are chosen as a package in their own allowance.',
    options: [
      // Kitchen sink
      { id: 'pl-ks1', name: 'Kraus Bellucci Undermount Sink', vendor: 'Kraus', price: 1890, image: 'https://images.thdstatic.com/productImages/fe4a0711-acbe-565f-bafa-1c99f5efca67/svn/metallic-black-kraus-undermount-kitchen-sinks-kguw2-33mbl-e1_600.jpg', selected: false, group: 'Kitchen sink', tier: 'base' as const, url: 'https://www.homedepot.com/p/KRAUS-Bellucci-White-Granite-Composite-32-in-Single-Bowl-Undermount-Workstation-Kitchen-Sink-with-WasteGuard-Garbage-Disposal-KGUW1-33WH-100-75MB/319044830' },
      { id: 'pl-ks2', name: 'Kohler Elmbrook Farmhouse Sink', vendor: 'Kohler', price: 2160, image: 'https://images.thdstatic.com/productImages/d9b0b956-0169-4319-ad0e-f96098bc1fcc/svn/white-kohler-farmhouse-kitchen-sinks-k-28668-0-e1_600.jpg', images: ['https://images.thdstatic.com/productImages/d9b0b956-0169-4319-ad0e-f96098bc1fcc/svn/white-kohler-farmhouse-kitchen-sinks-k-28668-0-e1_600.jpg', 'https://images.thdstatic.com/productImages/ee9fa0be-2001-480b-852c-bc1cd926941c/svn/white-kohler-farmhouse-kitchen-sinks-k-28668-0-77_600.jpg', 'https://photos-us.bazaarvoice.com/photo/2/cGhvdG86aG9tZWRlcG90/dca91f51-7570-55e9-9033-b407853daf71'], selected: false, group: 'Kitchen sink', tier: 'upgrade' as const, url: 'https://www.homedepot.com/p/KOHLER-Elmbrook-Cast-Iron-33-in-Single-Bowl-Farmhouse-Apron-Front-Kitchen-Sink-in-White-K-28668-0/316246054' },
      // Kitchen faucet
      { id: 'pl-kf1', name: 'Moen Arbor MotionSense, Stainless', vendor: 'Moen', price: 650, image: 'https://m.media-amazon.com/images/I/81Tdwh-vFUL.jpg', images: ['https://m.media-amazon.com/images/I/81Tdwh-vFUL.jpg', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQp_5oxh0J8UiRFoPUZjhkoDNurftH-7n96IQ&s'], selected: false, group: 'Kitchen faucet', tier: 'base' as const, url: 'https://www.homedepot.com/p/MOEN-Arbor-Single-Handle-Pull-Down-Sprayer-Kitchen-Faucet-with-Power-Boost-in-Spot-Resist-Stainless-7594SRS/204725308' , colors: [{ name: 'Stainless', hex: '#C9CDD2', image: 'https://m.media-amazon.com/images/I/81Tdwh-vFUL.jpg' }, { name: 'Matte black', hex: '#1F2124', image: 'https://mobileimages.lowes.com/productimages/b9f5b84c-5ac7-417f-aa2c-4ba4131f2aa7/69082796.jpeg' }, { name: 'Chrome', hex: '#E6E9ED', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQp_5oxh0J8UiRFoPUZjhkoDNurftH-7n96IQ&s' }] },
      { id: 'pl-kf2', name: 'Delta Kylo Touchless Faucet, Black', vendor: 'Delta', price: 780, image: 'https://mobileimages.lowes.com/productimages/b9f5b84c-5ac7-417f-aa2c-4ba4131f2aa7/69082796.jpeg', images: ['https://mobileimages.lowes.com/productimages/b9f5b84c-5ac7-417f-aa2c-4ba4131f2aa7/69082796.jpeg', 'https://mobileimages.lowes.com/productimages/aaa2b119-847d-4b26-9417-06db97eabd42/68533231.jpeg'], selected: false, group: 'Kitchen faucet', tier: 'upgrade' as const, url: 'https://www.lowes.com/pd/Delta-Kylo-Matte-Black-Single-Handle-Pull-down-Touchless-Kitchen-Faucet-with-Sprayer-Deck-Plate-Included/5015280915' },
    ],
  },
  {
    id: 'sel-4', name: 'Countertops & cabinetry', vendor: 'Allied Cabinets & Stone',
    allowance: 9200, dueDate: '2026-10-23', status: 'pending' as const,
    description: 'Pick countertop materials and vanity finishes. Cabinets and stone are fabricated by the same shop.',
    options: [
      // Kitchen countertop
      { id: 'cb-kc1', name: 'Granite Countertop, White Ice', vendor: 'MSI', price: 2800, image: 'https://cabinetmakerwarehouse.com/cdn/shop/files/Formica-9476-White-Ice-Granite-Traditiona-Kitchen-scaled.jpg?v=1717089142&width=1080', selected: false, group: 'Kitchen countertop', tier: 'base' as const },
      { id: 'cb-kc2', name: 'Quartz Countertop, Calacatta Laza', vendor: 'MSI', price: 3200, image: 'https://cdn.msisurfaces.com/images/quartz-countertops/products/roomscenes/large/calacatta-laza-quartz-4.jpg', selected: false, group: 'Kitchen countertop', tier: 'upgrade' as const },
      // Master bath vanity
      { id: 'cb-mv1', name: 'Double Vanity, 60" White Shaker', vendor: 'Home Decorators', price: 1850, image: 'https://m.media-amazon.com/images/I/81esKlRUTpL._AC_UF894,1000_QL80_.jpg', colors: [{ name: 'White', hex: '#F4F4F2' }, { name: 'Sage green', hex: '#9CAF94' }, { name: 'Navy', hex: '#2E3A55' }], selected: false, group: 'Master bath vanity', tier: 'base' as const },
      { id: 'cb-mv2', name: 'Double Vanity, 60" Espresso w/ Quartz Top', vendor: 'Home Decorators', price: 2650, image: 'https://whalenfurniture.com/wp-content/uploads/2023/09/60in-Estehaus-Vanity_SL60EHV.jpg', selected: false, group: 'Master bath vanity', tier: 'upgrade' as const },
      // Master bath mirror
      { id: 'cb-mm1', name: 'Frameless LED Mirror, 36" Round', vendor: 'TOOLKISS', price: 320, image: 'https://m.media-amazon.com/images/I/71uP4Hcb4jL.jpg', selected: false, group: 'Master bath mirror', tier: 'base' as const },
      { id: 'cb-mm2', name: 'Arched Brass Mirror, 24 in (2x)', vendor: 'Kohler', price: 640, image: 'https://whalenfurniture.com/wp-content/uploads/2023/09/60in-Estehaus-Vanity_SL60EHV.jpg', selected: false, group: 'Master bath mirror', tier: 'upgrade' as const },
      // Master bath cabinet hardware
      { id: 'cb-mh1', name: 'Bar Pulls, Matte Black (10x)', vendor: 'Amerock', price: 0, image: 'https://m.media-amazon.com/images/I/81esKlRUTpL._AC_UF894,1000_QL80_.jpg', selected: false, group: 'Master bath cabinet hardware', tier: 'base' as const },
      { id: 'cb-mh2', name: 'Knurled Pulls, Brushed Brass (10x)', vendor: 'Rejuvenation', price: 280, image: 'https://whalenfurniture.com/wp-content/uploads/2023/09/60in-Estehaus-Vanity_SL60EHV.jpg', colors: [{ name: 'Brushed brass', hex: '#C8A15A' }, { name: 'Matte black', hex: '#1F2124' }, { name: 'Polished nickel', hex: '#D6D3CC' }], selected: false, group: 'Master bath cabinet hardware', tier: 'upgrade' as const },
    ],
  },
  {
    id: 'sel-8', name: 'Master bath finishes', vendor: 'Various',
    allowance: 4200, dueDate: '2026-10-04', status: 'overdue' as const,
    description: 'The finishing touches for the master bath: shower glass, vanity lighting and wall paint.',
    options: [
      // Master bath shower glass
      { id: 'mb-sg1', name: 'Frameless Sliding Shower Door, Clear', vendor: 'DreamLine', price: 1450, image: 'https://images.thdstatic.com/productImages/502e06ba-dcea-4c4b-b2f0-5cc5a55a2704/svn/glossy-white-merola-tile-ceramic-tile-web3chgw-64_600.jpg', selected: false, group: 'Master bath shower glass', tier: 'base' as const },
      { id: 'mb-sg2', name: 'Fixed Glass Panel, Matte Black Frame', vendor: 'DreamLine', price: 1180, image: 'https://www.stonecenteronline.com/media/catalog/product/cache/f77b4f15034ebe734bb6931a52e0b5ed/c/7/c72xh-carrara-white-marble-1x3-herringbone-mosaic-tile-honed.jpg', selected: false, group: 'Master bath shower glass', tier: 'base' as const },
      // Master bath vanity lighting
      { id: 'mb-vl1', name: 'Globe Vanity Light, 3-Light, Black', vendor: 'Hukoro', price: 260, image: 'https://images.thdstatic.com/productImages/ba4f0ae8-66d7-4ba0-8767-2482a5886153/svn/black-henveton-pendant-lights-ylc900504-1b-e1_1000.jpg', colors: [{ name: 'Black', hex: '#1F2124' }, { name: 'Brushed brass', hex: '#C8A15A' }, { name: 'Chrome', hex: '#E6E9ED' }], selected: false, group: 'Master bath vanity lighting', tier: 'base' as const },
      { id: 'mb-vl2', name: 'Linear Sconce Pair, Brushed Brass', vendor: 'Rejuvenation', price: 540, image: 'https://images.thdstatic.com/productImages/10674fff-fe26-4bfd-b382-b9d2f4ffe230/svn/matte-gold-26-lnc-chandeliers-nbbfbzhd1362236-e4_600.jpg', selected: false, group: 'Master bath vanity lighting', tier: 'upgrade' as const },
      // Master bath paint
      { id: 'mb-pt1', name: 'Wall Paint, Sherwin-Williams Alabaster', vendor: 'Sherwin-Williams', price: 0, image: 'https://www.mineraltiles.com/cdn/shop/files/florence-calacatta-gold-porcelain-tile-39x39.jpg?v=1712084519&width=1150', selected: false, group: 'Master bath paint', tier: 'base' as const },
      { id: 'mb-pt2', name: 'Wall Paint, Benjamin Moore Pale Oak', vendor: 'Benjamin Moore', price: 0, image: 'https://cabinetmakerwarehouse.com/cdn/shop/files/Formica-9476-White-Ice-Granite-Traditiona-Kitchen-scaled.jpg?v=1717089142&width=1080', selected: false, group: 'Master bath paint', tier: 'base' as const },
    ],
  },
  {
    id: 'sel-5', name: 'Appliances', vendor: 'Capitol Appliance Co.',
    allowance: 2400, dueDate: '2026-11-06', status: 'pending' as const,
    description: 'Pick your kitchen appliances. The package is sourced through your appliance vendor.',
    options: [
      { id: 'ap-d1', name: 'GE Profile Dishwasher', vendor: 'GE Appliances', price: 1079, image: 'https://reviewed-com-res.cloudinary.com/image/fetch/s--1szEEAgv--/b_white,c_limit,cs_srgb,f_auto,fl_progressive.strip_profile,g_center,q_auto,w_1200/https://reviewed-production.s3.amazonaws.com/1662062743549/114647_Profile_Dish_CoBranding_2400x2500_1.jpeg', selected: false, group: 'Kitchen dishwasher', tier: 'base' as const, url: 'https://www.homedepot.com/p/GE-Profile-24-in-Smart-Built-In-Top-Control-45-dBA-Fingerprint-Resistant-Stainless-Dishwasher-with-Microban-Technology-PDT705SYWFS/331066211' },
      { id: 'ap-d2', name: 'Bosch 500 Series Dishwasher', vendor: 'Bosch', price: 1349, image: 'https://us.bosch-press.com/pressportal/us/media/dam_images_us/pi266_usus/shp65dm5n_lifestyleimage_1_master.jpg', selected: false, group: 'Kitchen dishwasher', tier: 'upgrade' as const, url: 'https://www.homedepot.com/p/Bosch-500-Series-24-in-Stainless-Steel-Top-Control-Tall-Tub-Pocket-Handle-Dishwasher-with-Stainless-Steel-Tub-Quiet-44-dBA-SHP65CM5N/325602597' },
    ],
  },
  {
    id: 'sel-7', name: 'Dining room finishes', vendor: 'Various',
    allowance: 14500, dueDate: '2026-04-10', status: 'approved' as const,
    description: 'Your builder has confirmed your dining room finishes. Track each item from order to install below.',
    options: [
      { id: 'dn-fl', name: 'Bruce Solid Hardwood, Butterscotch Oak', vendor: 'Bruce', price: 3900, image: 'https://images.thdstatic.com/productImages/c29747ad-e373-456b-8cdd-fc380f7fd554/svn/butterscotch-bruce-solid-hardwood-ahs626-64_1000.jpg', selected: true, group: 'Dining flooring', tier: 'upgrade' as const },
      { id: 'dn-bf', name: 'Built-in Buffet, White Shaker w/ Quartz Top', vendor: 'Allied Cabinets & Stone', price: 4200, image: 'https://m.media-amazon.com/images/I/81esKlRUTpL._AC_UF894,1000_QL80_.jpg', selected: true, group: 'Dining built-in', tier: 'upgrade' as const },
      { id: 'dn-sc', name: 'Wall Sconces, Matte Black (2x)', vendor: 'Hukoro', price: 480, image: 'https://images.thdstatic.com/productImages/ba4f0ae8-66d7-4ba0-8767-2482a5886153/svn/black-henveton-pendant-lights-ylc900504-1b-e1_1000.jpg', selected: true, group: 'Dining sconces', tier: 'base' as const },
      { id: 'dn-wc', name: 'Board & Batten Wainscoting, Painted', vendor: 'Metrie', price: 1650, image: 'https://whalenfurniture.com/wp-content/uploads/2023/09/60in-Estehaus-Vanity_SL60EHV.jpg', selected: true, group: 'Dining wainscoting', tier: 'upgrade' as const },
      { id: 'dn-pt', name: 'Wall Paint, Sherwin-Williams Agreeable Gray', vendor: 'Sherwin-Williams', price: 0, image: 'https://www.mineraltiles.com/cdn/shop/files/florence-calacatta-gold-porcelain-tile-39x39.jpg?v=1712084519&width=1150', selected: true, group: 'Dining paint', tier: 'base' as const },
      { id: 'dn-wt', name: 'Roman Shades, Natural Linen (3x)', vendor: 'Smith & Noble', price: 1270, image: 'https://s7d4.scene7.com/is/image/MohawkResidential/28989_743_room_02?scl=2&op_sharpen=1', selected: true, group: 'Dining window treatments', tier: 'upgrade' as const },
    ],
  },
  {
    id: 'sel-6', name: 'Lighting', vendor: 'Capitol Lighting',
    allowance: 6000, dueDate: '2026-04-20', status: 'approved' as const,
    description: 'Your builder has reviewed and confirmed your lighting choices. These are locked in for your project.',
    options: [
      { id: 'lt-1', name: 'Modern Chandelier, Dining', vendor: 'West Elm', price: 2400, image: 'https://images.thdstatic.com/productImages/10674fff-fe26-4bfd-b382-b9d2f4ffe230/svn/matte-gold-26-lnc-chandeliers-nbbfbzhd1362236-e4_600.jpg', selected: true, group: 'Dining chandelier', tier: 'upgrade' as const },
      { id: 'lt-2', name: 'Recessed Lighting (8x)', vendor: 'Commercial Electric', price: 1920, image: 'https://images.thdstatic.com/productImages/b9e47a4d-a64c-4755-90eb-3cebd7d8b345/svn/white-commercial-electric-recessed-lighting-retrofit-trims-ns01da09fr2-259-1d_1000.jpg', selected: true, group: 'Recessed lighting, whole house', tier: 'base' as const },
      { id: 'lt-3', name: 'Pendant Lights, Kitchen Island (3x)', vendor: 'Hukoro', price: 1350, image: 'https://images.thdstatic.com/productImages/ba4f0ae8-66d7-4ba0-8767-2482a5886153/svn/black-henveton-pendant-lights-ylc900504-1b-e1_1000.jpg', selected: true, group: 'Kitchen pendants', tier: 'base' as const },
    ],
  },
];

// Package-only option detail — items list keyed by option id. Kept outside the
// strictly-typed selectionGroups array so the rest of the code stays inferred.
const packageItems: Record<string, { name: string; qty: number; unit: string; price: number }[]> = {
  'pkg-bath-good': [
    { name: 'Vanity faucet, Chrome', qty: 2, unit: 'ea', price: 220 },
    { name: 'Shower trim & valve, Chrome', qty: 1, unit: 'ea', price: 280 },
    { name: 'Toilet, Round front', qty: 1, unit: 'ea', price: 380 },
    { name: 'Towel bars (24") + ring + hook', qty: 1, unit: 'set', price: 140 },
    { name: 'Bath accessories, Chrome', qty: 1, unit: 'set', price: 160 },
    { name: 'Installation labor', qty: 1, unit: 'lot', price: 3000 },
  ],
  'pkg-bath-better': [
    { name: 'Vanity faucet, Matte black widespread', qty: 2, unit: 'ea', price: 380 },
    { name: 'Shower trim, valve & rain head', qty: 1, unit: 'set', price: 540 },
    { name: 'Toilet, One-piece elongated', qty: 1, unit: 'ea', price: 680 },
    { name: 'Heated towel rack', qty: 1, unit: 'ea', price: 320 },
    { name: 'Bath accessories, Matte black set', qty: 1, unit: 'set', price: 240 },
    { name: 'Installation labor', qty: 1, unit: 'lot', price: 3300 },
  ],
  'pkg-bath-best': [
    { name: 'Vanity faucet, Brushed brass widespread', qty: 2, unit: 'ea', price: 620 },
    { name: 'Smart shower system w/ rain + body sprays', qty: 1, unit: 'set', price: 1280 },
    { name: 'Toilet, Smart bidet seat', qty: 1, unit: 'ea', price: 1400 },
    { name: 'Heated towel rack, Brushed brass', qty: 1, unit: 'ea', price: 480 },
    { name: 'Bath accessories, Designer set', qty: 1, unit: 'set', price: 420 },
    { name: 'Installation labor', qty: 1, unit: 'lot', price: 3800 },
  ],
};

const statusConfig = {
  overdue: { label: 'Overdue', color: '#B5254C', bg: '#FFEEEA' },
  action_needed: { label: 'Due soon', color: '#854D00', bg: '#FDF3D3' },
  pending: { label: 'Due soon', color: '#854D00', bg: '#FDF3D3' },
  approved: { label: 'Approved', color: '#057E4B', bg: '#DDFDEF' },
  ready: { label: 'Completed', color: '#057E4B', bg: '#DDFDEF' },
  in_progress: { label: 'In progress', color: '#004FD6', bg: '#E6F6FF' },
};

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type OptColor = { name: string; hex: string; image?: string };

// Slot names carry the room ("Master bath shower wall tile"). The room is
// already shown by the rail or the room heading, so drop it here.
const ROOM_PREFIXES = ['Master bath ', 'Kitchen ', 'Dining ', 'Powder ', 'Living room ', 'Bedroom '];
function slotLabel(name: string) {
  const p = ROOM_PREFIXES.find(r => name.startsWith(r));
  if (!p) return name;
  const rest = name.slice(p.length);
  return rest.charAt(0).toUpperCase() + rest.slice(1);
}

// $0 options are part of the base contract. Say "Included" instead of "$0.00".
function Price({ value, className = '' }: { value: number; className?: string }) {
  if (value === 0) return <span className={`${className} ws-included`}>Included</span>;
  return <span className={className}>${fmt(value)}</span>;
}

function Swatches({ colors, active, onPick, size = 'md' }: { colors: OptColor[]; active: number; onPick?: (i: number) => void; size?: 'sm' | 'md' }) {
  return (
    <div className={`ws-swatches ws-swatches-${size}`} role="radiogroup" aria-label="Color">
      {colors.map((c, i) => (
        <button
          key={c.name}
          type="button"
          role="radio"
          aria-checked={i === active}
          aria-label={c.name}
          title={c.name}
          className={`ws-swatch ${i === active ? 'ws-swatch-on' : ''}`}
          style={{ background: c.hex }}
          disabled={!onPick}
          onClick={(e) => { e.stopPropagation(); onPick?.(i); }}
        />
      ))}
    </div>
  );
}

// Section due line. Overdue reads as a date, not a growing day count, so a
// long-late item doesn't shout louder than one that just slipped.
function dueLabel(dateStr: string) {
  const diff = Math.ceil((new Date(dateStr + 'T23:59:59').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const d = formatDate(dateStr);
  if (diff < 0) return `Overdue since ${d}`;
  if (diff === 0) return 'Due today';
  if (diff === 1) return 'Due tomorrow';
  if (diff <= 7) return `Due ${d} (${diff} days)`;
  return `Due ${d}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
  'prototype-bds': { label: 'Custom / Remodel', jobName: 'Johnson Residence: Full Remodel', heroTitle: 'Selections (workshop)', heroDesc: 'Review and approve materials and finishes for your project. Your allowance budget is shown for each category.', showAllowance: true, showTiers: false, showDelta: false, showForecast: false, pricingLabel: 'Approved price' },
};

interface WorkshopProps {
  // Opened from a builder's no-login magic link
  magicLink?: { viewOnly: boolean; clientName: string };
  // A comparison someone shared: show only these options, read-only
  sharedCompareIds?: string[];
  sharedBy?: string;
  // How the builder chose to organize the client's page
  groupBy?: 'room' | 'allowance';
}

export default function ClientSelectionsWorkshop({ magicLink, sharedCompareIds, sharedBy, groupBy: builderGroupBy = 'room' }: WorkshopProps = {}) {
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
    showToast('Request sent. Your builder will review it.');
    resetRequest(gid);
  };
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  // Group the list by allowance (how the builder set it up) or by room (how the client walks the house)
  // Set by the builder, not the client
  const groupBy = builderGroupBy;
  const [expandedId] = useState<string | null>(null);
  const [selections, setSelections] = useState(selectionGroups);
  const [filter, setFilter] = useState<'all' | 'overdue' | 'action' | 'approved' | 'favorites'>('all');
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  useEffect(() => {
    if (!cartOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setCartOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cartOpen]);
  // Allowance-level panel (comment / request on the whole allowance)
  const [openAllowanceId, setOpenAllowanceId] = useState<string | null>(null);
  const [allowanceComments, setAllowanceComments] = useState<Record<string, AllowanceComment[]>>({
    'sel-2': [{ id: 'ac-1', from: 'builder', author: 'Smith Builders', text: 'Heads up: the marble hex is on a 3 week lead time, so please decide on the master bath floor by Oct 9.', date: 'Oct 1' }],
  });
  // Floor plan + mood board opens as its own full-width page
  const [planPage, setPlanPage] = useState<false | 'plan' | 'room'>(false);
  const [swipeGroupId, setSwipeGroupId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  const [lightboxImg, setLightboxImg] = useState<{images: string[]; name: string; index: number; url?: string} | null>(null);
  const [detailItem, setDetailItem] = useState<{ groupId: string; optionId: string } | null>(null);
  const [modalImgIdx, setModalImgIdx] = useState(0);
  const [commentsPanelOpen, setCommentsPanelOpen] = useState(false);
  const [compareSet, setCompareSet] = useState<Set<string>>(new Set());
  const [showCompare, setShowCompare] = useState(false);
  useEffect(() => { setModalImgIdx(0); }, [detailItem?.optionId]);
  useEffect(() => {
    if (!detailItem) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDetailItem(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [detailItem]);
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
  // Chosen color per option id (index into opt.colors). Defaults to the first color.
  const [optColor, setOptColor] = useState<Record<string, number>>({});
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
      const raw = localStorage.getItem('client-selections-workshop-progress-v3');
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
      localStorage.setItem('client-selections-workshop-progress-v3', JSON.stringify({
        selections,
        declinedOptions: Array.from(declinedOptions),
        submittedGroups: Array.from(submittedGroups),
        requests,
      }));
      showToast('Selections saved');
    } catch (e) {
      showToast('Could not save. Browser storage may be full.');
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


  const getSelectedTotal = (group: typeof selectionGroups[0]) => {
    return group.options.filter(o => o.selected).reduce((s, o) => s + o.price, 0);
  };

  const getDynamicStatus = (group: typeof selectionGroups[0]) => {
    if (group.status === 'approved') return 'approved';
    // Completed only when every selection group in the allowance has a pick.
    // Partly done keeps its due status (Overdue / Due soon) so it still reads as work to do.
    const optGroups = new Set(group.options.map(o => (o as any).group || o.id));
    const made = Array.from(optGroups).filter(g =>
      group.options.some(o => ((o as any).group || o.id) === g && o.selected)
    ).length;
    if (made === optGroups.size) return 'ready';
    return group.status;
  };

  const dynamicStatuses = selections.map(g => getDynamicStatus(g));
  const overdueCount = dynamicStatuses.filter(s => s === 'overdue').length;
  const actionCount = dynamicStatuses.filter(s => s === 'action_needed' || s === 'pending').length;

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
    : filter === 'overdue' ? sorted.filter(s => getDynamicStatus(s) === 'overdue')
    : filter === 'action' ? sorted.filter(s => { const ds = getDynamicStatus(s); return ds === 'action_needed' || ds === 'pending'; })
    : filter === 'favorites' ? sorted
        .filter(s => s.options.some(o => favoritedOptions.has(o.id)))
        .map(s => ({ ...s, options: s.options.filter(o => favoritedOptions.has(o.id)) }))
    : sorted.filter(s => { const ds = getDynamicStatus(s); return ds === 'approved' || ds === 'ready'; });

  // Floor plan: one "choice" per option group (e.g. "Kitchen flooring"),
  // rolled up to the room it belongs to.
  const roomSummaries: Record<string, RoomSummary> = {};
  selections.forEach(g => {
    const choices = new Map<string, boolean>();
    g.options.forEach(o => {
      const key = (o as any).group || o.id;
      choices.set(key, (choices.get(key) ?? false) || o.selected || g.status === 'approved');
    });
    choices.forEach((made, key) => {
      const room = roomForGroup(key);
      const r = roomSummaries[room] ?? (roomSummaries[room] = { state: 'empty', open: 0, overdue: 0, done: 0 });
      if (made) r.done++;
      else { r.open++; if (g.status === 'overdue') r.overdue++; }
    });
  });
  Object.values(roomSummaries).forEach(r => {
    r.state = r.overdue ? 'overdue' : r.open ? 'open' : r.done ? 'done' : 'empty';
  });

  const roomPhotos: Record<string, string[]> = {};
  selections.forEach(g => g.options.forEach(o => {
    if (!o.selected || !o.image) return;
    const room = roomForGroup((o as any).group || o.id);
    (roomPhotos[room] ??= []).push(o.image);
  }));

  // Mood board data: everything chosen, plus option groups still undecided
  const boardItems: BoardItem[] = [];
  const openSlots: Record<string, string[]> = {};
  selections.forEach(g => {
    const slots = new Map<string, typeof g.options>();
    g.options.forEach(o => { const k = (o as any).group || o.id; slots.set(k, [...(slots.get(k) ?? []), o]); });
    slots.forEach((opts, slot) => {
      const room = roomForGroup(slot);
      const chosen = opts.filter(o => o.selected);
      if (chosen.length === 0) { (openSlots[room] ??= []).push(slot); return; }
      chosen.forEach(o => {
        const color = (o as any).colors?.[optColor[o.id] ?? 0];
        boardItems.push({
          id: o.id, name: o.name, room, slot,
          image: (optColor[o.id] != null && color?.image) || o.image,
          status: g.status === 'approved' ? 'approved' : 'chosen',
        });
      });
    });
  });
  const openBoardItem = (optId: string) => {
    const g = selections.find(g => g.options.some(o => o.id === optId));
    if (g) setDetailItem({ groupId: g.id, optionId: optId });
  };

  const inRoom = (o: { id: string }) => roomForGroup((o as any).group || o.id) === selectedRoom;
  const visible = selectedRoom
    ? filtered
        .filter(g => g.options.some(inRoom))
        .map(g => ({ ...g, options: g.options.filter(inRoom) }))
    : filtered;

  const cartGroups = selections.filter(g => g.status !== 'approved' && g.options.some(o => o.selected));
  const cartItems = cartGroups.flatMap(group => group.options.filter(o => o.selected).map(opt => ({ group, opt })));
  const cartTotal = cartItems.reduce((sum, i) => sum + i.opt.price, 0);
  const cartAllowance = cartGroups.reduce((sum, g) => sum + g.allowance, 0);

  useEffect(() => { if (filter === 'overdue' && overdueCount === 0) setFilter('all'); }, [filter, overdueCount]);

  // Rooms ordered by how much still needs a decision (most first)
  const roomsByDue = [...FLOOR_PLAN_ROOMS].sort((a, b) => {
    const sa = roomSummaries[a.id], sb = roomSummaries[b.id];
    return (sb?.overdue ?? 0) - (sa?.overdue ?? 0) || (sb?.open ?? 0) - (sa?.open ?? 0);
  });

  // A room where every allowance is approved: show its picks right away (no collapse)
  const allDoneHere = visible.length > 0 && visible.every(g => g.status === 'approved');

  const swipeGroup = selections.find(g => g.id === swipeGroupId);

  if (sharedCompareIds && sharedCompareIds.length > 0) {
    const items = sharedCompareIds
      .map(id => { for (const g of selectionGroups) { const o = g.options.find(o => o.id === id); if (o) return { group: g, opt: o }; } return null; })
      .filter(Boolean) as { group: typeof selectionGroups[0]; opt: typeof selectionGroups[0]['options'][0] }[];
    return <SharedCompare items={items} sharedBy={sharedBy} />;
  }

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
      <div className="cs-preview-toggle ws-preview-toggle" role="tablist" aria-label="Preview mode">
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
        <div className="cs-hero ws-hero">
          <h1 className="cs-hero-title">{pc.heroTitle}</h1>
        </div>

        {magicLink && <MagicLinkBanner {...magicLink} />}

        {planPage ? (
          <FloorPlanPage
            onBack={() => setPlanPage(false)}
            summaries={roomSummaries}
            photos={roomPhotos}
            selectedRoom={selectedRoom}
            onSelectRoom={setSelectedRoom}
            board={<SelectionMoodBoard items={boardItems} openSlots={openSlots} summaries={roomSummaries} selectedRoom={selectedRoom} onSelectRoom={setSelectedRoom} onOpenItem={openBoardItem} />}
            onShowChoices={(room) => { setSelectedRoom(room); setPlanPage(false); }}
            roomOnly={planPage === 'room' && !!selectedRoom}
          />
        ) : (
        <div className="ws-layout">
        {/* Left rail: floor plan + rooms. The guided path through the house. */}
        <aside className="ws-rail ws-rooms" aria-label="Rooms">
          {/* Whole house: the floor plan. A room: that room's look, built from what's been chosen. */}
          {selectedRoom ? (
            <RoomVibe
              label={[...FLOOR_PLAN_ROOMS, { id: WHOLE_HOUSE_ID, label: 'Throughout the house' }].find(r => r.id === selectedRoom)?.label ?? ''}
              items={boardItems.filter(i => i.room === selectedRoom)}
              missing={openSlots[selectedRoom] ?? []}
              onOpenItem={openBoardItem}
              onOpenPlan={() => setPlanPage('room')}
            />
          ) : (
            <SelectionFloorPlan
              compact
              onToggleExpanded={() => setPlanPage('plan')}
              summaries={roomSummaries}
              photos={roomPhotos}
              selectedRoom={selectedRoom}
              onSelectRoom={setSelectedRoom}
            />
          )}
          <div className="ws-rail-eyebrow">Rooms</div>
          <button type="button" className={`ws-room ws-room-whole ${selectedRoom === null ? 'ws-room-on' : ''}`} aria-pressed={selectedRoom === null} onClick={() => setSelectedRoom(null)}>
            <span className="ws-room-name">Whole house</span>
            <span className="ws-room-sub">Floor plan and every room</span>
          </button>
          {roomsByDue.map(r => {
            const sum = roomSummaries[r.id];
            if (!sum) return null;
            return (
              <button key={r.id} type="button" className={`ws-room ${selectedRoom === r.id ? 'ws-room-on' : ''}`} aria-pressed={selectedRoom === r.id} onClick={() => setSelectedRoom(selectedRoom === r.id ? null : r.id)}>
                <span className="ws-room-name"><RoomIcon room={r.id} size={18} />{r.label}</span>
                <span className={`ws-room-status ws-room-status-${sum.state}`}>
                  {sum.state === 'done' ? 'Done' : sum.state === 'overdue' ? `${sum.overdue} overdue` : `${sum.open} due soon`}
                </span>
              </button>
            );
          })}
        </aside>

        <div className="ws-main">
        {/* Mobile: rooms as a chip row (the rooms rail is hidden) */}
        <div className="ws-mobile-rooms" role="group" aria-label="Rooms">
          <button type="button" className={`ws-mobile-room ${selectedRoom === null ? 'ws-mobile-room-on' : ''}`} aria-pressed={selectedRoom === null} onClick={() => setSelectedRoom(null)}>Whole house</button>
          {roomsByDue.map(r => {
            const sum = roomSummaries[r.id];
            if (!sum || sum.state === 'empty') return null;
            return (
              <button key={r.id} type="button" className={`ws-mobile-room ${selectedRoom === r.id ? 'ws-mobile-room-on' : ''}`} aria-pressed={selectedRoom === r.id} onClick={() => setSelectedRoom(selectedRoom === r.id ? null : r.id)}>
                <RoomIcon room={r.id} size={16} />{r.label}
              </button>
            );
          })}
          {cartItems.length > 0 && (
            <button type="button" className="ws-mobile-cart-link" onClick={() => setCartOpen(true)}>
              Your choices ({cartItems.length})
            </button>
          )}
        </div>
        {/* Below the width where the rail shows, keep the plan in the main column */}
        <div className="ws-main-plan">
          {selectedRoom ? (
            <RoomVibe
              collapsible
              key={`rv-${selectedRoom}-${previewMode}`}
              label={[...FLOOR_PLAN_ROOMS, { id: WHOLE_HOUSE_ID, label: 'Throughout the house' }].find(r => r.id === selectedRoom)?.label ?? ''}
              items={boardItems.filter(i => i.room === selectedRoom)}
              missing={openSlots[selectedRoom] ?? []}
              onOpenItem={openBoardItem}
              onOpenPlan={() => setPlanPage('room')}
            />
          ) : (
            <SelectionFloorPlan key={previewMode} startCollapsed={previewMode === 'mobile'} summaries={roomSummaries} photos={roomPhotos} selectedRoom={selectedRoom} onSelectRoom={setSelectedRoom} />
          )}
        </div>



        <div className="cs-filters">
          <div className="ws-chips" role="group" aria-label="Filter">
            {([
              ['all', 'All'],
              ...(overdueCount ? [['overdue', `Overdue (${overdueCount})`] as const] : []),
              ['action', `Due soon${actionCount ? ` (${actionCount})` : ''}`],
              ['favorites', `Favorites${favoritedOptions.size ? ` (${favoritedOptions.size})` : ''}`],
              ['approved', 'Completed'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`ws-chip ${filter === value ? 'ws-chip-on' : ''}`}
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="cs-view-toggle">
            <button className={`cs-view-btn ${viewMode === 'grid' ? 'cs-view-active' : ''}`} onClick={() => setViewMode('grid')} title="Card grid" aria-label="Card grid" aria-pressed={viewMode === 'grid'}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            </button>
            <button className={`cs-view-btn ${viewMode === 'compact' ? 'cs-view-active' : ''}`} onClick={() => setViewMode('compact')} title="Compact list" aria-label="Compact list" aria-pressed={viewMode === 'compact'}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div className="cs-cards">
          {(() => {
            const renderCard = (group: typeof selections[0], roomLabel?: string) => {
            // Room view passes a copy filtered to one room. Status, counts and money
            // always describe the whole allowance, so read them from the full one.
            const full = selections.find(g => g.id === group.id) ?? group;
            const selectedTotal = getSelectedTotal(full);
            const diff = full.allowance - selectedTotal;
            void expandedId; // keep state for swipe mode
            const dynamicStatus = getDynamicStatus(full);
            const sc = statusConfig[dynamicStatus as keyof typeof statusConfig];
            const isOverdue = group.status === 'overdue';

            return (
              <div key={group.id} id={`cs-group-${group.id}`} className={`cs-section ws-section-sticky ${isOverdue ? 'cs-card-overdue' : ''}`}>
                {/* Section header */}
                <div className="cs-section-header">
                  <div className="cs-section-left">
                    <div className="cs-section-title-block">
                      {roomLabel && <span className="ws-sticky-room">{roomLabel}</span>}
                      <div className="cs-section-title-row">
                        <h3 className="cs-section-name">
                          <button type="button" className="ws-section-link" onClick={() => setOpenAllowanceId(group.id)}>
                            {group.name}
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
                          </button>
                        </h3>
                        <BdsBadge
                          text={sc.label}
                          displayType={
                            dynamicStatus === 'overdue' ? 'danger'
                            : dynamicStatus === 'action_needed' || dynamicStatus === 'pending' ? 'warning'
                            : dynamicStatus === 'approved' || dynamicStatus === 'ready' ? 'success'
                            : dynamicStatus === 'in_progress' ? 'info'
                            : 'default'
                          }
                        />
                      </div>
                      <span className="cs-section-meta">
                        {(() => {
                          if (group.status === 'approved') return null;
                          // Count the groups shown here (one room in room view); note what's open elsewhere
                          const slotsOf = (g: { options: { id: string; selected: boolean }[] }) => Array.from(new Set(g.options.map(o => (o as any).group || o.id)));
                          const isDone = (g: { options: { id: string; selected: boolean }[] }, sl: string) => g.options.some(o => ((o as any).group || o.id) === sl && o.selected);
                          const here = slotsOf(group);
                          const doneHere = here.filter(sl => isDone(group, sl)).length;
                          const openElsewhere = slotsOf(full).filter(sl => !here.includes(sl) && !isDone(full, sl)).length;
                          return (
                            <>
                              {doneHere} of {here.length} chosen
                              {openElsewhere > 0 && <> ({openElsewhere} more in other rooms)</>}
                              {' '}&middot;{' '}
                            </>
                          );
                        })()}
                        {group.status === 'approved' ? 'Approved by your builder' : dueLabel(group.dueDate)}
                      </span>
                    </div>
                  </div>
                  <div className="cs-section-right">
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
                        // Picking keeps every option in view (the pick is just marked chosen).
                        // Only approved allowances tuck the unpicked options away.
                        const collapseOthers = isApproved && !isDeclinedExpanded;
                        const chosenOpts = collapseOthers ? opts.filter(o => o.selected) : opts;
                        const hiddenCount = isApproved ? opts.filter(o => !o.selected).length : 0;
                        // Note: sort already places chosen above declined when approved
                        return (
                          <div key={gName} className={`cs-opt-group ${isPrototype ? 'cs-opt-group-proto' : ''}`}>
                            {(isMultiChoice || isPrototype) && (
                              <div className={`cs-opt-group-header ${!isPrototype ? 'cs-opt-group-header-sticky' : 'cs-opt-group-header-proto'}`}>
                                <span className="cs-opt-group-name">{slotLabel(gName)}</span>
                                {isPrototype && group.status !== 'approved' && (
                                  <span className="cs-opt-group-count">
                                    {opts.some(o => o.selected) ? '1 selected' : `${opts.length} options`}
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
                                    <div key={opt.id} className={`cs-compact-row ${opt.selected ? 'cs-compact-row-selected' : ''} ${isDeclined ? 'cs-compact-row-declined' : ''} ${!opt.selected && opts.some(o => o.selected) ? 'ws-card-unpicked' : ''}`}>
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
                                        ) : <Price value={opt.price} />}
                                        {(opt as any).colors && <span className="ws-color-count-inline">{(opt as any).colors.length} colors</span>}
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
                                    <div key={opt.id} className={`cs-shop-card ${opt.selected ? 'cs-shop-card-selected' : ''} ${isDeclined ? 'cs-shop-card-declined' : ''} ${!opt.selected && opts.some(o => o.selected) ? 'ws-card-unpicked' : ''}`}>
                                      {(() => {
                                        const images = (opt as any).images || (opt.image ? [opt.image] : []);
                                        const imgIdx = cardImgIndex[opt.id] || 0;
                                        const colorImg = (opt as any).colors?.[optColor[opt.id] ?? 0]?.image;
                                        const currentImg = (optColor[opt.id] != null && colorImg) || images[imgIdx] || opt.image;
                                        const hasMultiple = images.length > 1;
                                        return (
                                          <div
                                            className="cs-shop-img"
                                            style={{ backgroundImage: currentImg ? `url(${currentImg})` : undefined, opacity: isDeclined ? 0.4 : 1, cursor: 'pointer' }}
                                            onClick={() => setDetailItem({ groupId: group.id, optionId: opt.id })}
                                          >
                                            {!currentImg && <div className="cs-shop-img-empty"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C7D0D9" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div>}
                                            {opt.selected && (
                                              group.status === 'approved' ? (
                                                <div className="cs-shop-badge-selected"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
                                              ) : (
                                                <button
                                                  type="button"
                                                  className="cs-shop-badge-selected ws-badge-toggle"
                                                  aria-label={`Unchoose ${opt.name}`}
                                                  title="Unchoose"
                                                  onClick={(e) => { e.stopPropagation(); toggleOption(group.id, opt.id); }}
                                                >
                                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                                </button>
                                              )
                                            )}
                                            <button
                                              className={`cs-shop-fav ${favoritedOptions.has(opt.id) ? 'cs-shop-fav-on' : ''}`}
                                              onClick={(e) => { e.stopPropagation(); toggleFavorite(opt.id); }}
                                              title={favoritedOptions.has(opt.id) ? 'Remove from favorites' : 'Save for later'}
                                              aria-label={favoritedOptions.has(opt.id) ? 'Remove from favorites' : 'Save for later'}
                                            >
                                              <svg width="18" height="18" viewBox="0 0 24 24" fill={favoritedOptions.has(opt.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                                            </button>
                                            {group.status !== 'approved' && (
                                              <button
                                                type="button"
                                                className={`ws-card-icon ws-card-compare ${compareSet.has(opt.id) ? 'ws-card-icon-on' : ''}`}
                                                onClick={(e) => { e.stopPropagation(); toggleCompare(opt.id); }}
                                                title={compareSet.has(opt.id) ? 'Remove from compare' : 'Compare'}
                                                aria-label={compareSet.has(opt.id) ? `Remove ${opt.name} from compare` : `Compare ${opt.name}`}
                                                aria-pressed={compareSet.has(opt.id)}
                                              >
                                                {compareSet.has(opt.id) ? (
                                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                ) : (
                                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                                )}
                                                {compareSet.has(opt.id) ? 'Comparing' : 'Compare'}
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
                                          ) : <Price value={opt.price} className="cs-shop-price" />}
                                        </div>
                                        {(opt as any).colors && (() => {
                                          const colors = (opt as any).colors as OptColor[];
                                          const active = optColor[opt.id] ?? 0;
                                          const locked = group.status === 'approved';
                                          return (
                                            <div className="ws-color-row">
                                              <Swatches colors={colors} active={active} onPick={locked ? undefined : (i) => setOptColor(prev => ({ ...prev, [opt.id]: i }))} />
                                              <span className="ws-color-label">{colors[active].name}<span className="ws-color-count"> · {colors.length} colors</span></span>
                                            </div>
                                          );
                                        })()}
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
                                          <div className="ws-card-actions">
                                            {isDeclined ? (
                                              <>
                                                <span className="ws-card-state ws-card-state-declined">Declined</span>
                                                <button type="button" className="ws-card-undo" onClick={() => undeclineOption(opt.id)}>Undo</button>
                                              </>
                                            ) : opt.selected ? (
                                              <>
                                                <span className="ws-card-state ws-card-state-chosen">
                                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                  Chosen
                                                </span>
                                                <button type="button" className="ws-card-undo" onClick={() => toggleOption(group.id, opt.id)}>Undo</button>
                                              </>
                                            ) : (
                                              <BdsButton text="Choose" displayType="primary" className="ws-card-choose" onClick={() => toggleOption(group.id, opt.id)} />
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
                                    setRequestText(prev => ({ ...prev, [group.id]: `Looking for a different ${gName.toLowerCase()} option. None of the current choices work.` }));
                                  }}>Request a different {gName.toLowerCase()}</button>
                                </div>
                              );
                            })()}
                            {hiddenCount > 0 && isApproved && (
                              <button className="cs-show-declined" onClick={() => setShowDeclined(prev => {
                                const next = new Set(prev);
                                if (next.has(declinedKey)) next.delete(declinedKey); else next.add(declinedKey);
                                return next;
                              })}>
                                {isDeclinedExpanded
                                  ? 'Hide other options'
                                  : isApproved
                                    ? `Show declined options (${hiddenCount})`
                                    : `Show ${hiddenCount} other ${hiddenCount === 1 ? 'option' : 'options'}`}
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

                    {/* Request an option lives in the allowance panel (click the allowance title) */}
                  </div>
              </div>
            );
            };

            if (visible.length === 0) {
              return (
                <div className="cs-empty-state">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C7D0D9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                  <div className="cs-empty-title">
                    {filter === 'action' || filter === 'overdue' ? "You're all caught up" : filter === 'favorites' ? 'No favorites yet' : 'No completed selections yet'}
                  </div>
                  <div className="cs-empty-desc">
                    {filter === 'action' || filter === 'overdue' ? 'No selections need your attention right now.' : filter === 'favorites' ? 'Tap the star on any option to save it here for later.' : 'Selections will appear here once approved.'}
                  </div>
                </div>
              );
            }
            if (groupBy === 'room') {
              // One section per room. Inside, each allowance shows only the
              // options for that room, so "Kitchen" collects kitchen flooring,
              // backsplash, sink, faucet and so on.
              const rooms = roomsByDue;
              const open = visible.filter(g => g.status !== 'approved');
              const approved = visible.filter(g => g.status === 'approved');
              const sections = rooms.map(r => {
                const inR = (o: { id: string }) => roomForGroup((o as any).group || o.id) === r.id;
                const groups = open.filter(g => g.options.some(inR)).map(g => ({ ...g, options: g.options.filter(inR) }));
                return { room: r, groups };
              }).filter(x => x.groups.length > 0);
              return (
                <div>
                  {sections.map(({ room, groups }) => {
                    return (
                      <div key={room.id} className="ws-room-section" data-room={room.id}>
                        {/* The rail already names the selected room; only label rooms on Whole house */}
                        {!selectedRoom && (
                          <h2 className="cs-group-title ws-room-title">
                            <span className="ws-room-title-name">{room.label}</span>
                          </h2>
                        )}
                        {groups.map(g => renderCard(g, !selectedRoom ? room.label : undefined))}
                      </div>
                    );
                  })}
                  {approved.length > 0 && filter === 'all' && (
                    <>
                      <h2 className="cs-group-title cs-group-title-clickable cs-group-approved" onClick={() => setApprovedExpanded(e => !e)} aria-expanded={approvedExpanded || allDoneHere}>
                        <svg className="cs-group-title-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                        <span>Approved</span>
                        <span className="cs-group-title-count">{approved.length}</span>
                        {!allDoneHere && (
                          <svg className="cs-group-title-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: approvedExpanded ? 'rotate(180deg)' : 'none' }}><polyline points="6 9 12 15 18 9" /></svg>
                        )}
                      </h2>
                      {(approvedExpanded || allDoneHere) && approved.map(g => renderCard(g))}
                    </>
                  )}
                </div>
              );
            }
            if (filter === 'all') {
              // Use original status for grouping so cards don't jump while making choices
              const overdue = visible.filter(g => g.status === 'overdue');
              // Soonest due first
              const toChoose = visible
                .filter(g => g.status === 'action_needed' || g.status === 'pending')
                .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
              const approved = visible.filter(g => g.status === 'approved');
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
                      {overdue.map(g => renderCard(g))}
                    </>
                  )}
                  {toChoose.length > 0 && (
                    <>
                      <h2 className="cs-group-title">
                        <svg className="cs-group-title-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                        </svg>
                        <span>Due soon</span>
                        <span className="cs-group-title-count">{toChoose.length}</span>
                      </h2>
                      {toChoose.map(g => renderCard(g))}
                    </>
                  )}
                  {approved.length > 0 && filter === 'all' && (
                    <>
                      <h2 className="cs-group-title cs-group-title-clickable cs-group-approved" onClick={() => setApprovedExpanded(e => !e)} aria-expanded={approvedExpanded || allDoneHere}>
                        <svg className="cs-group-title-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                        <span>Approved</span>
                        <span className="cs-group-title-count">{approved.length}</span>
                        {!allDoneHere && (
                          <svg className="cs-group-title-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: approvedExpanded ? 'rotate(180deg)' : 'none' }}><polyline points="6 9 12 15 18 9" /></svg>
                        )}
                      </h2>
                      {(approvedExpanded || allDoneHere) && approved.map(g => renderCard(g))}
                    </>
                  )}
                </>
              );
            }
            return visible.map(g => renderCard(g));
          })()}
        </div>
        </div>

        </div>
        )}


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
                          <span className="cs-review-modal-item-name">{opt.name}{(opt as any).colors ? ` (${(opt as any).colors[optColor[opt.id] ?? 0].name})` : ''}</span>
                          <Price value={opt.price} className="cs-review-modal-item-price" />
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


      {/* Cart panel: opened from "Your choices" */}
      {cartOpen && (
        <div className="ap-overlay" onClick={() => setCartOpen(false)}>
          <aside className="ap-panel ws-cart ws-cart-panel bds-scope bds-real-scope" role="dialog" aria-modal="true" aria-label="Your choices" onClick={e => e.stopPropagation()}>
          <div className="ws-cart-head">
            <span className="ws-cart-title">Your choices</span>
            <span className="ws-cart-count">{cartItems.length}</span>
            <span style={{ flex: 1 }} />
            <button type="button" className="ap-icon-btn" onClick={() => setCartOpen(false)} aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
          <div className="ws-cart-scroll">
          {cartItems.length === 0 ? (
            <div className="ws-cart-empty">Choose an option and it shows up here. Nothing is final until you submit.</div>
          ) : (
            <div className="ws-cart-groups">
              {cartGroups.map(group => {
                const picks = group.options.filter(o => o.selected);
                const spent = picks.reduce((sum, o) => sum + o.price, 0);
                const left = group.allowance - spent;
                const slots = new Set(group.options.map(o => (o as any).group || o.id));
                const done = Array.from(slots).filter(sl => group.options.some(o => ((o as any).group || o.id) === sl && o.selected)).length;
                return (
                  <section key={group.id} className="ws-cart-group">
                    <div className="ws-cart-group-head">
                      <span className="ws-cart-group-name">{group.name}</span>
                      <span className={`ws-cart-group-left ${left < 0 ? 'ws-over' : 'ws-under'}`}>
                        {left < 0 ? `$${fmt(Math.abs(left))} over` : `$${fmt(left)} left`}
                      </span>
                    </div>
                    {done < slots.size && (
                      <div className="ws-cart-group-todo">{slots.size - done} more to choose before you can submit this allowance</div>
                    )}
                    <ul className="ws-cart-list">
                      {picks.map(opt => (
                        <li key={opt.id} className="ws-cart-item">
                          <div className="ws-cart-thumb" style={{ backgroundImage: opt.image ? `url(${opt.image})` : undefined }} />
                          <div className="ws-cart-text">
                            <div className="ws-cart-meta">{slotLabel((opt as any).group || '')}</div>
                            <div className="ws-cart-name">{opt.name}</div>
                            {(opt as any).colors && (
                              <div className="ws-cart-color">
                                <i style={{ background: (opt as any).colors[optColor[opt.id] ?? 0].hex }} />
                                {(opt as any).colors[optColor[opt.id] ?? 0].name}
                              </div>
                            )}
                            <Price value={opt.price} className="ws-cart-price" />
                          </div>
                          <button type="button" className="ws-cart-remove" aria-label={`Remove ${opt.name}`} onClick={() => toggleOption(group.id, opt.id)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}
          {cartItems.length > 0 && (
            <div className="ws-cart-totals">
              <div className="ws-cart-row"><span>Allowances</span><span>${fmt(cartAllowance)}</span></div>
              <div className="ws-cart-row"><span>Your choices</span><span>${fmt(cartTotal)}</span></div>
              <div className="ws-cart-row ws-cart-row-big">
                <span>{cartTotal - cartAllowance > 0 ? 'Over allowance' : 'Under allowance'}</span>
                <span className={cartTotal - cartAllowance > 0 ? 'ws-over' : 'ws-under'}>
                  {cartTotal - cartAllowance > 0 ? '+' : '-'}${fmt(Math.abs(cartTotal - cartAllowance))}
                </span>
              </div>
              <p className="ws-cart-note ws-cart-note-last">Anything over allowance is added to your project once your builder approves it.</p>
            </div>
          )}
          </div>
          {pendingSubmit.length > 0 && (
            <div className="ws-cart-foot">
              <BdsButton text={`Submit ${pendingSubmit.length} completed ${pendingSubmit.length === 1 ? 'allowance' : 'allowances'}`} displayType="primary" className="ws-cart-submit" onClick={() => { setCartOpen(false); setShowReviewModal(true); }} />
              {pendingSubmit.length < cartGroups.length && (
                <p className="ws-cart-foot-note">Allowances still in progress stay saved here until every choice is made.</p>
              )}
            </div>
          )}
          </aside>
        </div>
      )}

      {openAllowanceId && (() => {
        const g = selections.find(x => x.id === openAllowanceId);
        if (!g) return null;
        const ds = getDynamicStatus(g);
        return (
          <AllowancePanel
            open
            audience="client"
            onClose={() => setOpenAllowanceId(null)}
            name={g.name}
            status={g.status === 'approved' ? 'Approved' : ds === 'ready' ? 'Completed' : g.status === 'overdue' ? 'Overdue' : 'Due soon'}
            dueLabel={g.status === 'approved' ? undefined : dueLabel(g.dueDate)}
            amount={g.allowance}
            description={g.description}
            options={g.options
              .filter(o => !declinedOptions.has(o.id))
              .map(o => ({
                id: o.id,
                name: o.name,
                price: o.price,
                image: o.image,
                slot: (o as any).group,
                status: (g.status === 'approved' ? (o.selected ? 'Approved' : 'Declined') : o.selected ? 'Chosen' : 'Not chosen') as AllowanceOptionStatus,
              }))
              .filter(o => !(g.status === 'approved' && o.status === 'Declined'))}
            onOpenOption={(id) => { setOpenAllowanceId(null); setDetailItem({ groupId: g.id, optionId: id }); }}
            onRequestOption={g.status === 'approved' ? undefined : () => { setOpenAllowanceId(null); setOpenRequestGroups(prev => new Set(prev).add(g.id)); }}
            comments={allowanceComments[g.id] ?? []}
            onAddComment={(text) => {
              setAllowanceComments(prev => ({ ...prev, [g.id]: [...(prev[g.id] ?? []), { id: `ac-${Date.now()}`, from: 'client', author: 'You', text, date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }] }));
              showToast('Comment sent to your builder');
            }}
          />
        );
      })()}

      {/* Option detail modal — V2-inspired info layer for any selection option */}
      {detailItem && (() => {
        const group = selections.find(g => g.id === detailItem.groupId);
        const opt = group?.options.find(o => o.id === detailItem.optionId);
        if (!group || !opt) return null;
        const isDeclined = declinedOptions.has(opt.id);
        const status: 'awaiting' | 'selected' | 'declined' =
          opt.selected ? 'selected' : isDeclined ? 'declined' : 'awaiting';
        const statusMap = {
          selected: { bg: 'rgba(5, 126, 75, 0.10)', fg: '#057E4B', label: group.status === 'approved' ? 'Approved' : 'Chosen' },
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
        const styleFromName = opt.name.includes(', ') ? opt.name.split(', ').pop()!.trim() : null;
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

        const baseImages: string[] = (opt as any).images || (opt.image ? [opt.image] : []);
        const colorImages: string[] = ((opt as any).colors || []).map((c: OptColor) => c.image).filter(Boolean);
        const modalImages: string[] = Array.from(new Set([...baseImages, ...colorImages]));
        const safeIdx = Math.min(modalImgIdx, Math.max(0, modalImages.length - 1));
        const heroImg = modalImages[safeIdx];
        const hasMultipleImages = modalImages.length > 1;

        return (
          <div className={`ws-detail-overlay ${previewMode === 'mobile' ? 'ws-detail-mobile' : ''}`} onClick={closeModal}>
            <div
              className="ws-detail-panel bds-scope bds-real-scope"
              role="dialog"
              aria-modal="true"
              aria-label={opt.name}
              onClick={e => e.stopPropagation()}
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
                      <div className="ws-detail-sub">{group.name} · {(opt as any).group}</div>
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
                      <span className="ws-detail-actions-top">
                        {status === 'selected' ? (
                          <BdsButton text="Undo" displayType="secondary" onClick={handleDecline} />
                        ) : status === 'declined' ? (
                          <BdsButton text="Undo decline" displayType="secondary" onClick={() => { undeclineOption(opt.id); closeModal(); }} />
                        ) : (
                          <>
                            <BdsButton text="Decline" displayType="secondary" onClick={handleDecline} />
                            <BdsButton text="Choose" displayType="primary" onClick={handleApprove} />
                          </>
                        )}
                      </span>
                    )}
                    <button className="ws-detail-close" onClick={closeModal} aria-label="Close">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Body — builder OptionDetailPage layout, read-only */}
              <div className="od-body cs-detail-body">
                <div className="od-content">
                  <div className="ws-detail-hero">
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

                      {(opt as any).colors && (
                        <div className="ws-detail-colors">
                          <div className="ws-detail-colors-label">Color: <strong>{(opt as any).colors[optColor[opt.id] ?? 0].name}</strong></div>
                          <Swatches
                            size="md"
                            colors={(opt as any).colors}
                            active={optColor[opt.id] ?? 0}
                            onPick={group.status === 'approved' ? undefined : (i) => {
                              setOptColor(prev => ({ ...prev, [opt.id]: i }));
                              const img = (opt as any).colors[i].image;
                              const idx = img ? modalImages.indexOf(img) : -1;
                              if (idx >= 0) setModalImgIdx(idx);
                            }}
                          />
                        </div>
                      )}
                      <div className="ws-detail-price"><Price value={opt.price} /></div>
                  </div>
                  {/* Details + Specs two-column */}
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
                            ? `Coordinated ${opt.name.toLowerCase()} package from ${opt.vendor}. Includes ${packageItems[opt.id].length} items: fixtures, accessories, and installation. Approving this locks in the entire set.`
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
                      <h3 className="od-section-title">Specs</h3>
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
                                      <td data-label="Item"><strong>{it.name}</strong></td>
                                      <td data-label="Description" style={{ color: 'var(--g600)' }}>Part of {opt.name}</td>
                                      <td data-label="Quantity" style={{ textAlign: 'right' }}>{it.qty}</td>
                                      <td data-label="Unit">{it.unit}</td>
                                      <td data-label="Unit cost" style={{ textAlign: 'right' }}>${fmt(it.price)}</td>
                                      <td data-label="Cost type">{it.name.toLowerCase().includes('labor') ? 'Labor' : 'Selection'}</td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr className="cs-detail-price-row">
                                    <td data-label="Item"><strong>{opt.name}</strong></td>
                                    <td data-label="Description" style={{ color: 'var(--g600)' }}>From {opt.vendor}</td>
                                    <td data-label="Quantity" style={{ textAlign: 'right' }}>1</td>
                                    <td data-label="Unit">ea</td>
                                    <td data-label="Unit cost" style={{ textAlign: 'right' }}>${fmt(opt.price)}</td>
                                    <td data-label="Cost type">{(opt as any).tier === 'upgrade' ? 'Selection (upgrade)' : 'Selection'}</td>
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

              {/* Phones: actions live in a sticky footer */}
              {group.status !== 'approved' && (
                <div className="ws-detail-foot">
                  {status === 'selected' ? (
                    <BdsButton text="Undo" displayType="secondary" onClick={handleDecline} />
                  ) : status === 'declined' ? (
                    <BdsButton text="Undo decline" displayType="secondary" onClick={() => { undeclineOption(opt.id); closeModal(); }} />
                  ) : (
                    <>
                      <BdsButton text="Decline" displayType="secondary" onClick={handleDecline} />
                      <BdsButton text={opt.price === 0 ? 'Choose, included' : `Choose, $${fmt(opt.price)}`} displayType="primary" onClick={handleApprove} />
                    </>
                  )}
                </div>
              )}

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
                    placeholder="Paste a product link and we'll pull the image"
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
        const styleFromName = (name: string) => name.includes(', ') ? name.split(', ').pop()!.trim() : '—';
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
            return <span style={{ color: '#854D00' }}>Due soon</span>;
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
                <span style={{ flex: 1 }} />
                <ShareCompareButton ids={items.map(it => it.opt.id)} />
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

      {/* Sticky footer: shows whenever there are choices to save or submit */}
      {(hasInteracted || cartItems.length > 0) && (
      <div className={`cs-sticky-footer ${isBds ? 'bds-scope bds-real-scope' : ''}`}>
        <div className="cs-sticky-inner">
          <button type="button" className="cs-sticky-info ws-footer-summary" onClick={() => setCartOpen(true)} disabled={cartItems.length === 0}>
            {cartItems.length > 0 && (
              <>
                <strong>{cartItems.length} {cartItems.length === 1 ? 'choice' : 'choices'}</strong>
                <span>${fmt(cartTotal)}</span>
              </>
            )}
          </button>
          <div className="cs-sticky-actions">
            <BdsButton text="Save" displayType="secondary" className="cs-save-btn" onClick={handleSaveProgress} />
            {pendingSubmit.length > 0 && (
              <BdsButton
                text="Review & submit"
                displayType="primary"
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 6h15l-1.5 9h-12z" /><path d="M6 6L5 3H2" /><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /></svg>}
                onClick={() => setCartOpen(true)}
              />
            )}
          </div>
        </div>
      </div>
      )}
    </>
  );
}

/* ── Share a comparison ──
 * Client copies a link to the current comparison to send to a partner.
 * The link opens a read-only compare page with "I like this one" reactions. */
function ShareCompareButton({ ids }: { ids: string[] }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState('Jordan');
  const link = `${window.location.origin}${window.location.pathname}?compare=${ids.join(',')}${name.trim() ? `&from=${encodeURIComponent(name.trim())}` : ''}#client-selections-workshop`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); } catch { /* clipboard blocked; field is selectable */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div style={{ position: 'relative', marginRight: 8 }}>
      <button type="button" className="sp-menu-btn sc-share-btn" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.6" y1="13.5" x2="15.4" y2="17.5" /><line x1="15.4" y1="6.5" x2="8.6" y2="10.5" /></svg>
        Share
      </button>
      {open && (
        <>
          <div className="sp-menu-backdrop" onClick={() => setOpen(false)} />
          <div className="sc-pop" role="dialog" aria-label="Share this comparison">
            <div className="sc-pop-title">Share this comparison</div>
            <p className="sc-pop-sub">Send to a partner or designer. They can see these {ids.length} options and tell you which they like. They can't make choices for you.</p>
            <label className="sh-label" htmlFor="sc-name">Your name</label>
            <input id="sc-name" className="sh-link-input sc-name" value={name} onChange={e => setName(e.target.value)} />
            <div className="sh-link-row" style={{ marginTop: 10 }}>
              <input className="sh-link-input" value={link} readOnly onFocus={e => e.currentTarget.select()} aria-label="Comparison link" />
              <button type="button" className={`sh-copy ${copied ? 'sh-copied' : ''}`} onClick={copy}>{copied ? 'Copied' : 'Copy link'}</button>
            </div>
            <span className="sh-live" role="status" aria-live="polite">{copied ? 'Link copied' : ''}</span>
            <a className="sc-pop-preview" href={link} target="_blank" rel="noopener noreferrer">Preview what they'll see</a>
          </div>
        </>
      )}
    </div>
  );
}

function SharedCompare({ items, sharedBy }: {
  items: { group: typeof selectionGroups[0]; opt: typeof selectionGroups[0]['options'][0] }[];
  sharedBy?: string;
}) {
  const [liked, setLiked] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);
  const who = sharedBy || 'Someone';
  const likedOpt = items.find(i => i.opt.id === liked)?.opt;

  if (items.length === 0) {
    return (
      <div className="scv-page bds-scope bds-real-scope">
        <div className="scv-empty">This comparison is no longer available.</div>
      </div>
    );
  }

  return (
    <div className="scv-page bds-scope bds-real-scope">
      <div className="scv-head">
        <div className="scv-eyebrow">Johnson Residence</div>
        <h1 className="scv-title">{who} wants your opinion</h1>
        <p className="scv-sub">{who} is comparing {items.length} options for {items[0].opt && ((items[0].opt as any).group || items[0].group.name).toLowerCase()}. Pick the one you like and add a note.</p>
      </div>

      <div className="scv-grid" style={{ gridTemplateColumns: `repeat(${Math.min(items.length, 4)}, minmax(0, 1fr))` }}>
        {items.map(({ group, opt }) => {
          const colors = (opt as any).colors as OptColor[] | undefined;
          const isLiked = liked === opt.id;
          return (
            <div key={opt.id} className={`scv-card ${isLiked ? 'scv-card-on' : ''}`}>
              <div className="scv-img" style={{ backgroundImage: opt.image ? `url(${opt.image})` : undefined }} />
              <div className="scv-body">
                <div className="scv-meta">{(opt as any).group || group.name}</div>
                <div className="scv-name">{opt.name}</div>
                <div className="scv-price"><Price value={opt.price} /></div>
                <dl className="scv-specs">
                  <div><dt>Brand</dt><dd>{opt.vendor}</dd></div>
                  {colors && <div><dt>Colors</dt><dd><Swatches colors={colors} active={0} size="sm" /></dd></div>}
                </dl>
                <button
                  type="button"
                  className={`scv-like ${isLiked ? 'scv-like-on' : ''}`}
                  aria-pressed={isLiked}
                  disabled={sent}
                  onClick={() => setLiked(isLiked ? null : opt.id)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" /></svg>
                  {isLiked ? 'Your pick' : 'I like this one'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="scv-reply">
        {sent ? (
          <div className="scv-sent" role="status">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            Sent to {who}. {likedOpt ? `You picked ${likedOpt.name}.` : ''}
          </div>
        ) : (
          <>
            <label className="sh-label" htmlFor="scv-note">Note for {who} (optional)</label>
            <textarea id="scv-note" className="scv-note" rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="Love the warmer tone, but is it hard to clean?" />
            <div className="scv-actions">
              <span className="scv-hint">{liked ? '' : 'Pick one above, or just send a note.'}</span>
              <button type="button" className="sh-done" disabled={!liked && !note.trim()} onClick={() => setSent(true)}>Send to {who}</button>
            </div>
          </>
        )}
      </div>
      <p className="scv-foot">Only {who} and their builder can make choices on this project.</p>
    </div>
  );
}

// Banner on a page opened from a builder's no-login link, with a way to
// grab the same link again.
function MagicLinkBanner({ viewOnly, clientName }: { viewOnly: boolean; clientName: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(window.location.href); } catch { /* clipboard blocked */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="ml-banner" role="note">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
      <span className="ml-banner-text">
        Shared with <strong>{clientName}</strong>. {viewOnly ? 'View only, no login needed.' : 'No login needed.'}
      </span>
      <button type="button" className={`ml-copy ${copied ? 'ml-copied' : ''}`} onClick={copy}>
        {copied ? (
          <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>Copied</>
        ) : (
          <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>Copy link</>
        )}
      </button>
      <span className="sh-live" role="status" aria-live="polite">{copied ? 'Link copied' : ''}</span>
    </div>
  );
}

// Live "vibe" board for the room the client is working on. Sits above the
// cart so every choice they make shows up next to the others in that room.
function RoomVibe({ label, items, missing, onOpenPlan, collapsible = false }: {
  label: string;
  items: BoardItem[];
  missing: string[];
  onOpenItem?: (id: string) => void;
  onOpenPlan: () => void;
  // Phones: start as one row, expand on tap
  collapsible?: boolean;
}) {
  const pics = items.filter(i => i.image);
  const total = items.length + missing.length;
  const [open, setOpen] = useState(!collapsible);
  if (collapsible && !open) {
    return (
      <section className="ws-rail rv rv-collapsed" aria-label={`${label} look`}>
        <button type="button" className="rv-collapsed-row" aria-expanded={false} onClick={() => setOpen(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(-90deg)' }} aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
          <span className="rv-collapsed-text">
            <span className="rv-eyebrow">Room look</span>
            <span className="rv-collapsed-meta">{items.length} of {total} picked</span>
          </span>
          <span className="rv-collapsed-thumbs" aria-hidden="true">
            {pics.slice(0, 3).map(it => <span key={it.id} style={{ backgroundImage: `url(${it.image})` }} />)}
          </span>
        </button>
      </section>
    );
  }
  return (
    <section className="ws-rail rv" aria-label={`${label} look`}>
      <div className="rv-head">
        {collapsible ? (
          <button type="button" className="rv-collapse-btn" aria-expanded onClick={() => setOpen(false)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
            <span>
              <span className="rv-eyebrow">Room look</span>
              <span className="rv-title">{label}</span>
            </span>
          </button>
        ) : (
          <div>
            <div className="rv-eyebrow">Room look</div>
            <div className="rv-title">{label}</div>
          </div>
        )}
        <button type="button" className="fp-expand" onClick={onOpenPlan} aria-label={`Open ${label} look`} title={`Open ${label} look`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></svg>
        </button>
      </div>
      {pics.length === 0 ? (
        <div className="rv-empty">Choose an option and it shows up here, next to everything else in the {label.toLowerCase()}.</div>
      ) : (
        <button type="button" className={`rv-grid rv-grid-${Math.min(pics.length, 5)}`} onClick={onOpenPlan} aria-label={`Open ${label} look`} title={`Open ${label} look`}>
          {pics.slice(0, 5).map((it, i) => (
            <span key={it.id} className="rv-tile" style={{ backgroundImage: `url(${it.image})` }}>
              {i === 4 && pics.length > 5 && <span className="rv-more">+{pics.length - 5}</span>}
            </span>
          ))}
        </button>
      )}
      {total > 0 && <div className="rv-foot">{items.length} of {total} picked</div>}
    </section>
  );
}
