import  { useEffect, useState } from 'react';
import { Sidebar } from '../SideBarSection/Sidebar';
import axios from 'axios';
import { 
  HiOutlinePlus, 
  HiOutlinePencil, 
  HiOutlineTrash,
  HiOutlineLink,
  HiOutlinePhotograph,
  HiOutlineDocumentText,
  HiOutlineCalendar
} from 'react-icons/hi';
import { FaSpinner } from 'react-icons/fa';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProducts = () => {
    setIsLoading(true);
    axios.get(`${import.meta.env.VITE_API_BASE_URL}/products`)
      .then(response => {
        setProducts(response.data.data || []);
      }) 
      .catch(error => console.error('Error fetching products:', error))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/products/${id}`);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(event.target);
    const productData = {
      description: formData.get('description'),
      link: formData.get('link'),
      imgLink: formData.get('imgLink')
    };

    try {
      if (editingProduct) {
        await axios.put(`${import.meta.env.VITE_API_BASE_URL}/products/${editingProduct.id}`, productData);
      } else {
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/products`, productData);
      }
      setShowModal(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
  <>
  Dismissed
  </>
    
  );
};

export default Products;