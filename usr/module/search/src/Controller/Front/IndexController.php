<?php
/**
 * Pi Engine (http://pialog.org)
 *
 * @link            http://code.pialog.org for the Pi Engine source repository
 * @copyright       Copyright (c) Pi Engine http://pialog.org
 * @license         http://pialog.org/license.txt New BSD License
 */

namespace Module\Search\Controller\Front;

use Pi;
use Pi\Mvc\Controller\ActionController;
use Pi\Paginator\Paginator;

/**
 * Search controller
 *
 * @author  Taiwen Jiang <taiwenjiang@tsinghua.org.cn>
 */
class IndexController extends ActionController
{
    /**
     * Search in available modules
     *
     * @return void
     */
    public function indexAction()
    {
        $query  = $this->params('q');
        $modules = $this->getModules($query);

        if ($query) {
            $terms  = $query ? $this->parseQuery($query) : array();
            if ($terms) {
                $limit  = $this->config('leading_limit');
                $result = $this->query($terms, $limit);
            } else {
                $result = array();
            }
            $total = 0;
            foreach ($result as $name => $data) {
                $total += $data->getTotal();
            }
            $this->view()->assign(array(
                'query'     => $query,
                'result'    => $result,
                'total'     => $total,
            ));
            $this->view()->setTemplate('search-result');
        } else {
            $this->view()->setTemplate('search-form');
        }
        $this->view()->assign(array(
            'modules'   => $modules,
            'service'   => $this->serviceList($query),
        ));
    }

    /**
     * Search in a specific module
     */
    public function moduleAction()
    {
        $query  = $this->params('q');
        $page   = $this->params('page') ?: 1;
        $module = $this->params('m');

        $modules = $this->getModules($query);
        if (!isset($modules[$module])) {
            $this->redirectTo(array('action' => 'index'));
            return;
        }
        $label = $modules[$module]['title'];
        unset($modules[$module]);

        if ($query) {
            $terms  = $query ? $this->parseQuery($query) : array();
            if ($terms) {
                $limit  = $this->config('list_limit');
                $offset = $limit * ($page -1);
                $result = $this->query($terms, $limit, $offset, $module);
                $total  = $result ? $result->getTotal() : 0;
            } else {
                $result = array();
                $total  = 0;
            }
            if ($total > $limit) {
                $paginator = Paginator::factory($total, array(
                    'limit' => $limit,
                    'page'  => $page,
                    'url_options'   => array(
                        'params'    => array(
                            'm' => $module,
                        ),
                        'options'   => array(
                            'query' => array(
                                'q' => $query,
                            ),
                        ),
                    ),
                ));
            } else {
                $paginator = null;
            }
            $this->view()->assign(array(
                'query'     => $query,
                'result'    => $result,
                'total'     => $total,
                'paginator' => $paginator,
            ));
            $this->view()->setTemplate('search-module-result');
        } else {
            $this->view()->setTemplate('search-module-form');
        }
        $this->view()->assign(array(
            'modules'   => $modules,
            'label'     => $label,
        ));
    }

    /**
     * Parse search terms from query string
     *
     * @param string $query
     *
     * @return array
     */
    protected function parseQuery($query = '')
    {
        return array('test', 'query terms');

        $terms = array();
        $pattern = '/(["\'])(?>[^"\']|["\'](?<!\1)|(?<=\\)\1)*+\1/';
        $callback = function ($m) use (&$terms) {
            $terms[] = $m[1];
            return '';
        };
        $string = preg_replace_callback($pattern, $callback, $query);
        $list = explode(' ', $string);
        $length = $this->config('min_length');
        array_walk($list, function ($term) use (&$terms, $length) {
            if (!$length || strlen($term) >= $length) {
                $terms[] = $term;
            }
        });

        return $terms;
    }

    /**
     * Do search query
     *
     * @param array        $terms
     * @param int          $limit
     * @param int          $offset
     * @param string|array $in
     *
     * @return array
     */
    protected function query(array $terms, $limit = 0, $offset = 0, $in = array())
    {
        $moduleSearch   = Pi::registry('search')->read();
        $moduleList     = Pi::registry('modulelist')->read();
        $modules        = (array) $in;
        $result         = array();

        foreach ($moduleSearch as $name => $callback) {
            if ($modules && !in_array($name, $modules)) {
                continue;
            }
            if (!isset($moduleList[$name])) {
                continue;
            }
            $searchHandler = new $callback($name);
            $result[$name] = $searchHandler->query($terms, $limit, $offset);
        }

        if (is_scalar($in)) {
            $result = isset($result[$in]) ? $result[$in] : array();
        }

        return $result;
    }

    /**
     * Get modules available for search
     *
     * @param string $query
     *
     * @return array
     */
    protected function getModules($query = '')
    {
        $moduleSearch   = Pi::registry('search')->read();
        $moduleList     = Pi::registry('modulelist')->read();
        $modules        = array();
        foreach (array_keys($moduleSearch) as $name) {
            if (!isset($moduleList[$name])) {
                continue;
            }
            $node = $moduleList[$name];
            $url = $this->url(
                '',
                array(
                    'action'    => 'module',
                    'm'         => $name
                ),
                array(
                    'query' => array (
                        'q' => urlencode($query),
                    ),
                )
            );
            $modules[$name] = array(
                'id'        => $node['id'],
                'title'     => $node['title'],
                'icon'      => $node['icon'],
                'url'       => $url,
            );
        };

        return $modules;
    }

    /**
     * Get third-party search service list
     *
     * @param string $query
     *
     * @return array
     */
    protected function serviceList($query = '')
    {
        $home = Pi::url('www');

        $googleQuery = function ($query) use ($home) {
            $home = preg_replace('/^(http[s]?:\/\/)/i', '', $home);
            $link = 'http://google.com?#newwindow=1&q=' . urlencode($query . ' site:' . $home);

            return $link;
        };
        $baiduQuery = function ($query) use ($home) {
            $home = parse_url($home, PHP_URL_HOST);
            $link = 'http://www.baidu.com/s?wd=' . urlencode($query . ' site:' . $home);

            return $link;
        };
        $list = array(
            array(
                'title' => __('Google'),
                'url'   => $googleQuery($query),
            ),
            array(
                'title' => __('Baidu'),
                'url'   => $baiduQuery($query),
            ),
        );

        return $list;
    }
}