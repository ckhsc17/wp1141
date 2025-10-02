// 共用的 Tailwind 樣式組合
export const buttonStyles = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 font-medium',
  secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg transition-colors duration-200 font-medium',
  danger: 'bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 font-medium',
  icon: 'p-3 rounded-full shadow-lg transition-opacity duration-300',
  floating: 'absolute top-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300',
  gallery: 'bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full transition-colors duration-200',
  cart: 'relative bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full transition-colors duration-200',
  collection: 'bg-green-600 hover:bg-green-700 text-white p-3 rounded-full transition-colors duration-200'
};

export const cardStyles = {
  base: 'bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden',
  baseSimple: 'bg-white rounded-lg shadow-md',
  content: 'p-6',
  contentCompact: 'p-4',
  title: 'text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors',
  titleLarge: 'text-2xl font-bold text-gray-900',
  description: 'text-gray-600 mb-4 line-clamp-3',
  price: 'text-2xl font-bold text-green-600',
  priceCompact: 'text-lg font-bold text-green-600'
};

export const layoutStyles = {
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  containerPadded: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8',
  grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  gridLarge: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8',
  flexBetween: 'flex justify-between items-center',
  flexCenter: 'flex items-center justify-center'
};

export const inputStyles = {
  base: 'border border-gray-300 rounded-lg px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900',
  search: 'w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 '
};

export const textStyles = {
  label: 'block text-sm font-medium text-gray-700 mb-1',
  detail: 'font-medium text-gray-700',
  value: 'text-gray-600',
  small: 'text-xs text-gray-500 italic',
  error: 'text-red-500',
  success: 'text-green-600',
  title: 'text-xl font-bold text-gray-900',
  subtitle: 'text-sm text-gray-500',
  price: 'text-lg font-bold text-green-600'
};

export const cartStyles = {
  overlay: 'fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end',
  sidebar: 'bg-white w-full max-w-md h-full overflow-y-auto shadow-xl',
  header: 'p-6 border-b border-gray-200',
  content: 'p-6',
  contentCenter: 'p-6 text-center',
  item: 'border border-gray-200 rounded-lg p-4',
  itemContent: 'flex items-start space-x-3',
  itemDetails: 'flex-1',
  footer: 'border-t border-gray-200 p-6',
  quantityButton: 'bg-gray-200 hover:bg-gray-300 text-gray-700 w-8 h-8 rounded-full flex items-center justify-center',
  removeButton: 'text-red-500 hover:text-red-700 text-sm'
};