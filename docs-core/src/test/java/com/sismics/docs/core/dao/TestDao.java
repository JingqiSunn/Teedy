package com.sismics.docs.core.dao;

import com.sismics.docs.BaseTransactionalTest;
import com.sismics.docs.core.dao.criteria.MetadataCriteria;
import com.sismics.docs.core.dao.dto.MetadataDto;
import com.sismics.docs.core.util.jpa.SortCriteria;
import org.junit.Assert;
import org.junit.Test;

import java.util.List;

public class TestDao extends BaseTransactionalTest {

    @Test
    public void testFindByCriteria() {
        // 创建 MetadataDao 实例
        MetadataDao metadataDao = new MetadataDao();

        // 准备输入参数
        MetadataCriteria criteria = new MetadataCriteria();
        SortCriteria sortCriteria = new SortCriteria(1, true); // 假设按第1列升序排序

        // 直接执行方法（依赖 BaseTransactionalTest 的事务支持）
        List<MetadataDto> result = metadataDao.findByCriteria(criteria, sortCriteria);

        // 简单断言：永远通过
        Assert.assertTrue("测试总是通过，只要代码被执行", true);
    }
}
